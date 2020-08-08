import { app, BrowserWindow, Tray, Menu, ipcMain } from 'electron'
import path = require('path')
import { errors } from './errors';
import { auto } from './auto-launch'
import { startPrograms, stopPrograms, childProcesses } from './run-startup-file';
import { constants } from './common';

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
        width: 800, height: 600, maximizable: true, show: false,
        closable: false, webPreferences: { nodeIntegration: true }
    })
    win.loadFile('index.html')
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
            async click(item) {
                if (tray == null)
                    throw errors.objectIsNull('tray')

                if (item.checked) {
                    await auto.enable();
                }
                else {
                    await auto.disable()
                }
            }
        },
        {
            label: '退出',
            click() {
                stopPrograms()
                app.exit()
            }
        }
    ])

    tray = new Tray(path.join(app.getAppPath(), 'content/th.png'))
    tray.setContextMenu(contextMenu)

    win.webContents.send(constants.childProcessesChanged, childProcesses.value)
    childProcesses.add(value => {
        win.webContents.send(constants.childProcessesChanged, value)
    })

    ipcMain.on(constants.getChildProcesses, (event: { sender: any }) => {
        event.sender.send(constants.childProcessesChanged, childProcesses.value)
    })
}


app.on('ready', createWindow)

startPrograms()