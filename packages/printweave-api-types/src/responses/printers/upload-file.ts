import {UnauthorizedError} from "../../errors";

export type UploadFileError = UnauthorizedError | {
    code: 400,
    message: 'Unsupported file type' | 'Invalid file'
} | Invalid3mfFileError;

export type Invalid3mfFileError = {
    code: 400,
    message: 'Invalid 3mf file'
}
