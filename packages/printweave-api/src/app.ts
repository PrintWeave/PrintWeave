import {IPrintWeaveApp} from "@printweave/models";
import {BasePrinter, IPluginManager, Printer} from "@printweave/models";
import {ModelStatic} from "sequelize";
import {PrinterStatus, StatusType} from "@printweave/api-types";

class PrinterCache {
    public printerStatus: { status: PrinterStatus | null, statusType: StatusType | null } | null;
    public cachedAt: number;
    public cacheDuration: number; // in milliseconds

    constructor(printerStatus: {
        status: PrinterStatus | null,
        statusType: StatusType | null
    } | null, cacheDuration: number = 300000) {
        this.printerStatus = printerStatus;
        this.cachedAt = Date.now();
        this.cacheDuration = cacheDuration;
    }

    isValid(): boolean {
        return (Date.now() - this.cachedAt) < this.cacheDuration;
    }

    update(printerStatus: { status: PrinterStatus | null, statusType: StatusType | null }): void {
        this.printerStatus = printerStatus;
        this.cachedAt = Date.now();
    }
}

export class App implements IPrintWeaveApp {
    private pluginManager: IPluginManager;

    constructor(pluginManager: IPluginManager) {
        this.pluginManager = pluginManager;
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

        if (cache && cache.isValid()) {
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

        this.setPrinterStatusCache(printerId, {status, statusType: fullPrinter.statusType}, fullPrinter.getCacheTime());

        return {status, statusType: fullPrinter.statusType};
    }

    private setPrinterStatusCache(printerId: number, status: {
        status: PrinterStatus | null,
        statusType: StatusType | null
    }, printerCacheTime?: number): void {
        const cache = this.printersCache.get(printerId);
        if (cache) {
            cache.update(status);
        } else {
            this.printersCache.set(printerId, new PrinterCache(status, printerCacheTime));
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

        this.setPrinterStatusCache(printerId, {status, statusType: fullPrinter.statusType}, printerCacheTime);

        return status;
    }

    async getPrinter(printerId: number): Promise<Printer> {
        return await Printer.findByPk(printerId);
    }
}
