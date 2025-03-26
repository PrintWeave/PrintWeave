import {BasePrinter, IPluginManager, Plugin, Express} from "@printweave/models";

export class PrinterPlugin implements Plugin {
    initializeEvents(manager: IPluginManager): void {

    }

    createPrinter(options: any): BasePrinter {
        return undefined;
    }

    registerRoutes(app: Express): void {
    }

}
