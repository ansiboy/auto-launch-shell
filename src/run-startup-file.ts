import { spawn, exec, ChildProcess } from "child_process";
import fs = require('fs')
import path = require('path')
import json5 = require('json5')
import { app } from "electron";
import { errors } from "./errors";

let binPath = path.join(app.getAppPath(), 'bin')
let child_processes: { [key: string]: ChildProcess } = {}
let logCaches: { [name: string]: string[] } = {}

function runStartupFile(dirPath: string, fileName: string, args?: string[]) {
    args = args || []
    let pathName = path.join(dirPath, fileName)
    if (child_processes[pathName]) {
        return
    }

    let child_process = spawn(fileName, args, { cwd: dirPath })
    console.log(`run ${pathName}`)
    child_process.stderr.on('data', (data) => {
        console.log(data.toString());
    });

    child_process.stdout.on('data', (data: Uint8Array) => {
        log(pathName, data.toString())
        console.log(data.toString());
    })

    child_process.on('close', (code) => {
        delete child_processes[pathName]
        console.log('child process exited with code ' + code);
    });

    child_process.on('error', (err) => {
        console.error(err);
    })

    child_processes[pathName] = child_process
}


function log(pathName: string, data: string) {
    if (!pathName) throw errors.argumentNull('pathName')
    let logFileName = pathName.split('.').slice(0, -1).join('.') + '.log'
    let logCache = logCaches[logFileName]
    if (!logCache) {
        logCache = logCaches[logFileName] = []
    }
    logCache.push(data)
}

setInterval(() => {

    let names = Object.getOwnPropertyNames(logCaches)
    for (let i = 0; i < names.length; i++) {
        let filePath = names[i]
        // let filePath = path.join(binPath, fileName)

        if (logCaches[filePath]) {
            if (!fs.existsSync(filePath)) {
                fs.writeFileSync(filePath, logCaches[filePath].join('\n'))
            }
            else {
                fs.appendFileSync(filePath, logCaches[filePath].join('\n'))
            }
            delete logCaches[filePath]
        }
    }

}, 1000 * 10)


export function startPrograms() {
    if (!fs.existsSync(binPath)) {
        return
    }

    fs.readdirSync(binPath).forEach(file => {
        let pathName = path.join(binPath, file)
        let states = fs.lstatSync(pathName)
        if (states.isFile() && path.extname(file) == '.exe') {
            runStartupFile(binPath, file)
            return
        }

        if (states.isDirectory()) {
            let configPath = startupConfigPath(pathName)
            if (configPath == null)
                return

            let content = fs.readFileSync(configPath)
            let config: StartupConfig = json5.parse(content.toString())
            if (!config.main)
                throw errors.startupConfigFieldNull('main')

            runStartupFile(pathName, config.main, config.args)
        }
    })
}

export type StartupConfig = {
    main: string,
    args: string[]
}

function startupConfigPath(dir: string) {
    let pathName = path.join(dir, 'startup.json5')
    if (!fs.existsSync(pathName)) {
        return null
    }
    return pathName
}

export function stopPrograms() {
    let names = Object.getOwnPropertyNames(child_processes)
    names.forEach(name => {
        child_processes[name].kill()
    })
}