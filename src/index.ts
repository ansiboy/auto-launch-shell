import { app, BrowserWindow, Tray, Menu } from 'electron'
import path = require('path')
import fs = require('fs')
import { errors } from './errors';
import { auto } from './auto-launch'
import { runStartupFile } from './run-startup-file';

//==========================================================
// app 仅有单例
app.requestSingleInstanceLock();
app.on('second-instance', function () {
    app.quit();
})
//==========================================================

//==========================================================
// tray 不能作为函数的局域变量，否则会让 GC 回收，导致 tray crash
// https://github.com/electron/electron/issues/822
let tray: Tray | null = null
//==========================================================


async function createWindow() {
    let win = new BrowserWindow({
        width: 800, height: 600, maximizable: false, show: false,
        closable: false
    })
    win.loadFile('src/index.html')
    win.setAutoHideMenuBar(true)
    win.setSkipTaskbar(true)

    let isAuto = await auto.isEnabled()
    let contextMenu = Menu.buildFromTemplate([
        {
            label: '显示',
            click() {
                win.show()
            }
        },
        {
            label: '开机启动', type: 'checkbox',
            checked: isAuto,
            click(item) {
                if (tray == null)
                    throw errors.objectIsNull('tray')

                let checked = !item.checked
                if (checked) {
                    auto.enable();
                }
                else {
                    auto.disable()
                }
            }
        },
        {
            label: '退出',
            click() {
                app.exit()
            }
        }
    ])

    tray = new Tray(path.join(__dirname, 'content/th.png'))
    tray.setContextMenu(contextMenu)
}


app.on('ready', createWindow)

let binPath = path.join(app.getAppPath(), 'bin')
if (fs.existsSync(binPath) == true) {
    fs.readdirSync(binPath).forEach(file => {
        if (path.extname(file) == '.exe') {
            runStartupFile(binPath, file)
        }
    })
}