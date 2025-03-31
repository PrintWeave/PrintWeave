import {IPrintWeaveApp} from "@printweave/models/dist/models/printweave.app.js";
import {BasePrinter, IPluginManager, Printer} from "@printweave/models";
import {ModelStatic} from "sequelize";

export class App implements IPrintWeaveApp {
    private pluginManager: IPluginManager;

    constructor(pluginManager: IPluginManager) {
        this.pluginManager = pluginManager;
    }

    async getFullPrinter(printer: Printer): Promise<BasePrinter> {
        for (const plugin of this.pluginManager.getPlugins()) {
            if (plugin.printerType === printer.type) {
                const printerClass: ModelStatic<BasePrinter> = plugin.printerClass;
                return await printerClass.findOne({ where: { printerId: printer.id } })
            }
        }

        return null;
    }

    async getPrinter(printerId: number): Promise<Printer> {
        return await Printer.findByPk(printerId);
    }
}
