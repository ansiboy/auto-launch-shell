import { spawn, exec } from "child_process";
import fs = require('fs')
import path = require('path')
import json5 = require('json5')

/* args.json5 配置文件示例
{
    "mgrok.exe": ['-log=stdout', "80"], //
}
*/

export function runStartupFile(dirPath: string, fileName: string) {

    let args: { [key: string]: string[] } = {};
    let argsPath = path.join(dirPath, 'args.json5')
    if (fs.existsSync(argsPath)) {
        let content = fs.readFileSync(argsPath)
        args = json5.parse(content.toString())
    }

    let child_process = spawn(fileName, args[fileName] || [], { cwd: dirPath })
    console.log(`run ${fileName}`)
    child_process.stderr.on('data', (data) => {
        debugger
        console.log(data.toString());
    });

    child_process.stdout.on('data', (data) => {
        console.log(data.toString());
    })

    child_process.on('close', (code) => {
        debugger
        console.log('child process exited with code ' + code);
    });

    child_process.on('error', (err) => {
        debugger
        console.error(err);
    })
}