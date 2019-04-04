"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const path = require("path");
const errors_1 = require("./errors");
const auto_launch_1 = require("./auto-launch");
//==========================================================
// app 仅有单例
electron_1.app.requestSingleInstanceLock();
electron_1.app.on('second-instance', function () {
    electron_1.app.quit();
});
//==========================================================
//==========================================================
// tray 不能作为函数的局域变量，否则会让 GC 回收，导致 tray crash
// https://github.com/electron/electron/issues/822
let tray = null;
//==========================================================
function createWindow() {
    return __awaiter(this, void 0, void 0, function* () {
        let win = new electron_1.BrowserWindow({
            width: 800, height: 600, maximizable: false, show: false,
            closable: false
        });
        win.loadFile('index.html');
        win.setAutoHideMenuBar(true);
        win.setSkipTaskbar(true);
        let isAuto = yield auto_launch_1.auto.isEnabled();
        let contextMenu = electron_1.Menu.buildFromTemplate([
            {
                label: '显示',
                click() {
                    win.show();
                }
            },
            {
                label: '开机启动', type: 'checkbox',
                checked: isAuto,
                click(item) {
                    if (tray == null)
                        throw errors_1.errors.objectIsNull('tray');
                    let checked = !item.checked;
                    if (checked) {
                        auto_launch_1.auto.enable();
                    }
                    else {
                        auto_launch_1.auto.disable();
                    }
                }
            },
            {
                label: '退出',
                click() {
                    electron_1.app.exit();
                }
            }
        ]);
        tray = new electron_1.Tray(path.join(__dirname, 'content/th.png'));
        tray.setContextMenu(contextMenu);
    });
}
electron_1.app.on('ready', createWindow);
//# sourceMappingURL=index.js.map