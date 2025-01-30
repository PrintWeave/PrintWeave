import {
    AbstractCommand,
    BambuClient,
    CommandResponse, IncomingMessageData,
    isInfoMessage,
    isMCPrintMessage,
    isPrintMessage
} from "bambu-node";


const OwnPrintMessageCommandsValues = ['stop', 'pause', 'resume'] as const;
export type OwnPrintMessageCommands = typeof OwnPrintMessageCommandsValues[number];

export type OwnPrintMessageCommand = {
    command: OwnPrintMessageCommands
    param?: string,
    result?: string
}

export interface OwnPrintMessage {
    print: OwnPrintMessageCommands
}

export function isOwnPrintMessage(data: any): data is OwnPrintMessage {
    return (
        !!data?.print &&
        !!data?.print?.command &&
        ['stop'].includes(
            data.print.command
        )
    )
}

export class OwnBambuClient extends BambuClient {
    public override async executeCommand(command: AbstractCommand, block: boolean = false): Promise<CommandResponse> {
        if (!(this.status === "OFFLINE") && this.config.throwOnOfflineCommands)
            throw new Error(`Unable to send commands while disconnected from printer!`)

        if (block) {
            return new Promise((resolve, reject) => {
                // run command
                command.invoke(this).catch(err => reject(err))

                // start a timeout which rejects the promise after 5 seconds
                const timeout = setTimeout(() => {
                    reject(new Error("Command execution timed out after 5 seconds."))
                }, 5000)

                // wait for a response
                this.on("rawMessage", (topic: string, payload: Buffer) => {
                    const data = JSON.parse(payload.toString())
                    const key = Object.keys(data)[0]

                    if (!(isOwnPrintMessage(data) || isInfoMessage(data) || isMCPrintMessage(data) || isPrintMessage(data)))
                        return

                    const response = (data as unknown as IncomingMessageData)[key] as CommandResponse

                    if (!response?.command) return

                    if (command.ownsResponse(response)) {
                        // clear the timeout and resolve the promise
                        clearTimeout(timeout)
                        resolve(response)
                    }
                })
            })
        } else {
            return new Promise((resolve, reject) => {
                command.invoke(this).catch(err => reject(err))
                resolve(null)
            });
        }
    }
}
