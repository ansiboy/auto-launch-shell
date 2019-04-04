"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const AutoLaunch = require("auto-launch");
const path = require("path");
const fs = require("fs");
const electron_1 = require("electron");
//TODO: 其他平台
if (process.platform == 'win32') {
    let electronPath = path.join(electron_1.app.getAppPath(), 'node_modules/electron/dist/electron.exe');
    let vbs = `Set ws = CreateObject("Wscript.Shell")     
    ws.run "cmd /c ${electronPath} ${electron_1.app.getAppPath()}",0`;
    let autoRunPath = path.join(__dirname, 'auto-run.vbs');
    fs.writeFileSync(autoRunPath, vbs);
    exports.auto = new AutoLaunch({
        name: 'Minecraft',
        path: autoRunPath,
    });
}
//# sourceMappingURL=auto-launch.js.map