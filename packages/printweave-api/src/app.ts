import {IPrintWeaveApp} from "@printweave/models";
import {BasePrinter, IPluginManager, Printer} from "@printweave/models";
import {ModelStatic} from "sequelize";
import {PrinterStatus, PrinterStatusData, StatusType} from "@printweave/api-types";
import {logger, websocketsManager} from "./main.js";

class PrinterCache {
    public printerStatus: { status: PrinterStatus | null, statusType: StatusType | null } | null;
    public cachedAt: number;
    public cacheDuration: number; // in milliseconds
    public cacheDurationNull: number = 5000; // Default cache duration for null status
    public imageLastUpdatedAt: number;
    public imageCacheDuration: number; // in milliseconds

    constructor(printerStatus: {
        status: PrinterStatus | null,
        statusType: StatusType | null
    } | null, cacheDuration: number = 30000) {
        this.printerStatus = printerStatus;
        this.cachedAt = Date.now();
        this.cacheDuration = cacheDuration;
        this.imageLastUpdatedAt = 0;
        this.imageCacheDuration = 60000; // Default image cache duration of 1 minute
    }

    isValid(): boolean {
        return (Date.now() - this.cachedAt) < (this.printerStatus.status === null ? this.cacheDurationNull : this.cacheDuration);
    }

    update(printerStatus: { status: PrinterStatus | null, statusType: StatusType | null }): void {
        this.printerStatus = printerStatus;
        this.cachedAt = Date.now();
    }

    updateImage(imageBase64: string) {
        this.printerStatus.status.image = imageBase64;
        this.imageLastUpdatedAt = Date.now();
    }
}

export class App implements IPrintWeaveApp {
    private pluginManager: IPluginManager;

    constructor(pluginManager: IPluginManager) {
        this.pluginManager = pluginManager;
    }

    getPrinterStatusFromCache(printerId: number): Promise<PrinterStatus | null> {
        const cache = this.printersCache.get(printerId);

        this.updatePrinterImage(printerId, false);

        if (cache && cache.isValid()) {
            return Promise.resolve(cache.printerStatus.status);
        }
        return Promise.resolve(null);
    }

    private printersCache = new Map<number, PrinterCache>();

    async getFullPrinter(printer: Printer): Promise<BasePrinter> {
        for (const plugin of this.pluginManager.getPlugins()) {
            if (plugin.printerType === printer.type) {
                const printerClass: ModelStatic<BasePrinter> = plugin.printerClass;
                return await printerClass.findOne({where: {printerId: printer.id}})
            }
        }

        return null;
    }

    async getPrinterStatusCached(printerId: number): Promise<{
        status: PrinterStatus | null,
        statusType: StatusType | null
    }> {
        const cache = this.printersCache.get(printerId);

        this.updatePrinterImage(printerId, false);

        if (cache && cache.isValid()) {
            await websocketsManager.sendMessagePrinter(printerId, 'printerStatus', {
                printerId: printerId,
                status: cache.printerStatus.status,
                statusType: cache.printerStatus.statusType,
                printer: await this.getPrinter(printerId)
            } as PrinterStatusData).then(r => {
                logger.info(`Sent cached printer status update for printer ${printerId}`);
            });

            return cache.printerStatus;
        }

        const printer = await Printer.findByPk(printerId);
        if (!printer) {
            return {status: null, statusType: null};
        }

        const fullPrinter = await this.getFullPrinter(printer);
        if (!fullPrinter) {
            return {status: null, statusType: null};
        }

        const status = await fullPrinter.getStatus();
        if (!status) {
            return {status: null, statusType: fullPrinter.statusType};
        }

        this.setPrinterStatusCache(printer, {
            status,
            statusType: fullPrinter.statusType
        }, fullPrinter.getCacheTime());

        return {status, statusType: fullPrinter.statusType};
    }

    private updatePrinterImagesInProgress = new Set<number>();

    public async updatePrinterImage(printerId: number, force: boolean = false): Promise<void> {
        const cache = this.printersCache.get(printerId);

        if (cache && !force && (Date.now() - cache.imageLastUpdatedAt) < cache.imageCacheDuration) {
            return; // Image is still valid, no need to update
        }

        if (!cache) {
            logger.warn(`No cache found for printer ${printerId}, skipping image update.`);
            return;
        }

        if (cache.printerStatus.statusType === StatusType.OFFLINE) {
            logger.info(`Printer ${printerId} is offline, skipping image update.`);
            return; // Printer is offline, no need to update image
        }

        const printer = await Printer.findByPk(printerId);
        if (!printer) {
            return; // No printer found in cache
        }

        const fullPrinter = await this.getFullPrinter(printer);
        if (!fullPrinter) {
            return; // No full printer found
        }

        if (this.updatePrinterImagesInProgress.has(printerId)) {
            logger.info(`Image update for printer ${printerId} is already in progress, skipping.`);
            return; // Image update is already in progress
        }

        this.updatePrinterImagesInProgress.add(printerId);

        if (fullPrinter) {
            fullPrinter.getVideoProcessor().then((videoProcessor) => {
                if (videoProcessor) {
                    videoProcessor.getSingleImage().then(async (image) => {
                        logger.info(`Received image for printer ${printerId}`);
                        if (!image) {
                            logger.warn(`No image received for printer ${printerId}`);
                            return;
                        }

                        const imageBase64 = "data:image/jpeg;base64," + image.toString('base64');

                        // get the current status from the cache
                        let printerCache = this.printersCache.get(printerId);

                        if (printerCache) {
                            printerCache.updateImage(imageBase64);

                            websocketsManager.sendMessagePrinter(printerId, 'printerStatus', {
                                printerId: printerId,
                                status: printerCache.printerStatus.status,
                                statusType: printerCache.printerStatus.statusType,
                                printer: await this.getPrinter(printerId)
                            } as PrinterStatusData).then(r => {
                                logger.info(`Sent updated image for printer ${printerId}`);
                            });

                            this.updatePrinterImagesInProgress.delete(printerId);
                        }

                    }).then(() => {
                        logger.info(`Updated image for printer ${printerId}`);
                        this.updatePrinterImagesInProgress.delete(printerId);
                    }).catch((error) => {
                        console.error(`Error getting image for printer ${printerId}:`, error);
                    });
                }
            }).catch((error) => {
                console.error(`Error getting video processor for printer ${printerId}:`, error);
            });
        }
    }

    setPrinterStatusCache(printer: Printer, status: {
        status: PrinterStatus;
        statusType: StatusType
    }, printerCacheTime?: number): void {
        const cache = this.printersCache.get(printer.id);
        if (cache) {
            const oldStatus = cache.printerStatus;
            const newStatus = {
                status: status.status || oldStatus?.status || null,
                statusType: status.statusType || oldStatus?.statusType || null
            }

            cache.update(newStatus);
            websocketsManager.sendMessagePrinter(printer.id, 'printerStatus', {
                printerId: printer.id,
                status: newStatus.status,
                statusType: newStatus.statusType,
                printer: printer
            } as PrinterStatusData).then(r => {
                logger.info(`Sent printer status update for printer ${printer.id}`);
            });
        } else {
            this.printersCache.set(printer.id, new PrinterCache(status, printerCacheTime));
        }
    }

    async getPrinterStatus(printerId: number): Promise<PrinterStatus | null> {
        const printer = await Printer.findByPk(printerId);
        if (!printer) {
            return null;
        }

        const fullPrinter = await this.getFullPrinter(printer);
        if (!fullPrinter) {
            return null;
        }

        let status = await fullPrinter.getStatus();

        if (!status) {
            return null;
        }

        const printerCacheTime = fullPrinter.getCacheTime();

        this.setPrinterStatusCache(printer, {status, statusType: fullPrinter.statusType}, printerCacheTime);

        return status;
    }

    async getPrinter(printerId: number): Promise<Printer> {
        return await Printer.findByPk(printerId);
    }
}
