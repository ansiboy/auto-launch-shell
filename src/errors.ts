import { StartupConfig } from "run-startup-file";

export let errors = {
    objectIsNull(objectName: string) {
        let msg = `Object ${objectName} is null.`
        let err = new Error(msg)
        err.name = errors.objectIsNull.name
        return err
    },
    argumentNull(argumentName: string) {
        let msg = `Argument ${argumentName} can not null or empty`
        let err = new Error(msg)
        err.name = errors.argumentNull.name
        return err
    },
    startupConfigFieldNull(field: keyof StartupConfig) {
        let msg = `Startup config file miss ${field} field.`
        let err = new Error(msg)
        err.name = errors.startupConfigFieldNull.name
        return err
    }
}