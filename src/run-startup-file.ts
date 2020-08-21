import { ChildProcess } from "child_process";
import fs = require('fs')
import path = require('path')
import { app, remote } from "electron";
import { errors } from "./errors";
import shelljs = require('shelljs')
import { ValueStore } from "./value-storage";
import { constants } from "./common";

let binPath = path.join((app || remote.app).getAppPath(), constants.binPath)
let logCaches: { [name: string]: string[] } = {}

export let childProcesses = new ValueStore<{ [key: string]: ChildProcess }>({})

let commandsFilePath = path.join(binPath, constants.commandsFile)

function runStartupFile(startProgram: StartupProgram) {
    if (!startProgram) throw errors.argumentNull('startProgram')
    let { cwd, command } = startProgram
    if (cwd) {
        cwd = path.isAbsolute(cwd) ? cwd : path.join(binPath, cwd)
    }

    if (getChildProcessesItem(command)) {
        return
    }

    let child_process = shelljs.exec(command, { cwd, async: true })
    console.log(`run ${command}`)
    if (child_process.stderr)
        child_process.stderr.on('data', (data) => {
            console.log(data.toString());
        });

    if (child_process.stdout)
        child_process.stdout.on('data', (data: Uint8Array) => {
            if (startProgram.log)
                log(startProgram.log, data.toString())

            console.log(data.toString());
        })

    child_process.on('close', (code) => {
        deleteChildProcessesItem(command)
        console.log('child process exited with code ' + code);
    });

    child_process.on('error', (err) => {
        console.error(err);
    })

    setChildProcessesItem(command, child_process)
}


function log(logFileName: string, data: string) {
    let logCache = logCaches[logFileName];
    if (!logCache) {
        logCache = logCaches[logFileName] = [];
    }
    logCache.push(data);
}

setInterval(() => {

    let names = Object.getOwnPropertyNames(logCaches)
    for (let i = 0; i < names.length; i++) {
        let pathName = names[i]
        if (logCaches[pathName]) {
            if (!fs.existsSync(pathName)) {
                fs.writeFileSync(pathName, logCaches[pathName].join('\n'))
            }
            else {
                fs.appendFileSync(pathName, logCaches[pathName].join('\n'))
            }
            delete logCaches[pathName]
        }
    }

}, 1000 * 5)


function getChildProcessesItem(name: string) {
    if (childProcesses.value == null) throw errors.objectIsNull('child_processes.value')
    return childProcesses.value[name]
}

function deleteChildProcessesItem(name: string) {
    if (childProcesses.value == null) throw errors.objectIsNull('child_processes.value')
    let items = childProcesses.value
    delete items[name]
    childProcesses.value = items
}

function setChildProcessesItem(name: string, item: ChildProcess) {
    if (childProcesses.value == null) throw errors.objectIsNull('child_processes.value')
    let items = childProcesses.value
    items[name] = item
    childProcesses.value = items
}

export function startPrograms() {
    if (!fs.existsSync(binPath)) {
        return
    }

    if (!fs.existsSync(commandsFilePath))
        return

    let commandsFielContent = fs.readFileSync(commandsFilePath)
    let commands: StartupProgram[] = JSON.parse(commandsFielContent.toString())
    for (let i = 0; i < commands.length; i++) {
        runStartupFile(commands[i])
    }
}

export type StartupConfig = {
    main: string,
    args: string[]
}

export function stopPrograms() {
    let names = Object.getOwnPropertyNames(childProcesses.value)
    names.forEach(name => {
        stopProgram(name)
    })
    shelljs.exit()
}

export function stopProgram(command: string) {
    if (!command) throw errors.argumentNull('command')
    let p = getChildProcessesItem(command)
    if (!p) return

    p.kill()
    deleteChildProcessesItem(command)
}

export function startProgram(item: StartupProgram) {
    if (!item) throw errors.argumentNull('item')
    runStartupFile(item)
}