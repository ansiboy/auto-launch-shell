"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errors = {
    objectIsNull(objectName) {
        let msg = `Object ${objectName} is null.`;
        return new Error(msg);
    }
};
//# sourceMappingURL=errors.js.map