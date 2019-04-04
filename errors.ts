export let errors = {
    objectIsNull(objectName: string) {
        let msg = `Object ${objectName} is null.`
        return new Error(msg)
    }
}