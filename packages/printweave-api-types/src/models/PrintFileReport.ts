export interface PrintFileReport {
    plates: {
        hasGcode: boolean,
        id: string,
        name: string,
        thumbnail: string,
        internal: {
            gcodeFile: string,
            thumbnailFile: string,
            pickFile: string,
            patternBBoxFile: string,
            topFile: string,
            thumbnailNoLightFile: string,
        }
    }[];
}

export interface ModelSettingsConfig {
    plate: {

    }[]
}
