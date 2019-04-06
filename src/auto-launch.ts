import AutoLaunch = require('auto-launch')
import path = require('path')
import fs = require('fs')
import { app } from 'electron'

export let auto: AutoLaunch
//TODO: 其他平台
if (process.platform == 'win32') {
    let electronPath = path.join(app.getAppPath(), 'node_modules/electron/dist/electron.exe')
    let vbs = `Set ws = CreateObject("Wscript.Shell")     
    ws.run "cmd /c ${electronPath} ${app.getAppPath()}",0`

    let binPath = path.join(app.getAppPath(), 'bin')
    if (fs.existsSync(binPath) == false) {
        fs.mkdirSync(binPath)
    }

    let autoRunPath = path.join(binPath, 'auto-run.vbs')
    fs.writeFileSync(autoRunPath, vbs)
    auto = new AutoLaunch({
        name: 'auto-launch-shell',
        path: autoRunPath,
    });

}

