import React = require('react')
import ReactDOM = require('react-dom')
import { FormValidator, rules as r } from 'maishu-dilu'
import { errors } from './errors';
import { buttonOnClick } from 'maishu-ui-toolkit'
// import { commandsFilePath, StartupProgram, childProcesses } from './run-startup-file'
import fs = require('fs')
import path = require('path')
import { ChildProcess } from 'child_process';
import { remote, ipcRenderer, BrowserWindow } from 'electron';
import { constants } from './common';
import { CSSProperties } from 'react';
import * as RunStartupFile from "./run-startup-file";

const COMMAND = 'command';
const CWD = 'cwd';
const LOG = "log";

// let commandsFile = path.join(binPath, 'commands.json')
let commandsFilePath = path.join(remote.app.getAppPath(), constants.binPath, constants.commandsFile)
interface State {
    startupPrograms: (StartupProgram & { status?: 'start' | 'stop' })[],
    defaultCWD: boolean,
    defaultLOG: boolean,
    command?: string,
    cwd?: string,
    log?: string,
}

let programButtonsWidth = 160;
let programTextStyle: Partial<CSSProperties> = {
    width: `calc((100% - ${programButtonsWidth}px) / 3)`,
    overflow: "hidden",
    textOverflow: "ellipsis",
    height: 40
}
let programTitleStyle: Partial<CSSProperties> = {
    fontWeight: "bold",
    textAlign: "center",
    height: 40
}


class MainView extends React.Component<{}, State> {
    validator: FormValidator | null = null;
    formElement: HTMLElement | null = null;

    constructor(props: any) {
        super(props)

        let startupPrograms: State['startupPrograms'] = []
        if (fs.existsSync(commandsFilePath)) {
            let commandsFielContent = fs.readFileSync(commandsFilePath).toString()
            startupPrograms = JSON.parse(commandsFielContent)
        }
        this.state = { startupPrograms, defaultCWD: true, defaultLOG: true }
    }
    setEmpty() {
        this.setState({ command: "", cwd: "", log: "", defaultCWD: true, defaultLOG: true });
    }
    updateStatus(childProcesses: { [key: string]: ChildProcess }) {
        if (childProcesses == null) throw errors.argumentNull('childProcesses')
        let { startupPrograms } = this.state
        let commands = Object.getOwnPropertyNames(childProcesses)
        commands.forEach(command => {
            let startupProgram = startupPrograms.filter(s => s.command == command)[0]
            if (startupProgram) {
                startupProgram.status = 'start'
            }
        })

        this.setState({ startupPrograms })
    }

    async addItem() {
        if (!this.validator) throw errors.objectIsNull('validator')
        if (!this.validator.check()) {
            return Promise.reject('validate form fail.')
        }
        let { startupPrograms, command, cwd, log } = this.state;
        if (!command)
            throw new Error("State of command is null or empty.");

        if (!cwd)
            throw new Error("State of cwd is null or emtpy.");

        startupPrograms.push({ command, cwd, log });
        this.setState({ startupPrograms });
        let text = JSON.stringify(startupPrograms);
        fs.writeFileSync(commandsFilePath, text);
        this.setEmpty();
    }
    async deleteItem(index: number) {
        let { startupPrograms } = this.state;
        startupPrograms = startupPrograms.filter((o, i) => i != index);
        let text = JSON.stringify(startupPrograms);
        fs.writeFileSync(commandsFilePath, text);
        this.setState({ startupPrograms });
    }
    async executeItem(item: StartupProgram) {
        var mod: typeof RunStartupFile = remote.require("./run-startup-file");
        mod.startProgram(item);
    }
    componentDidMount() {
        if (!this.formElement) throw errors.objectIsNull('formElement')
        this.validator = new FormValidator(this.formElement,
            { name: COMMAND, rules: [r.required('请输入执行命令')] },
            { name: CWD, rules: [r.required('请输入执行目录')] }
        )

        ipcRenderer.on(constants.childProcessesChanged, (event: any, value: { [key: string]: ChildProcess }) => {
            this.updateStatus(value)
        })
        ipcRenderer.send(constants.getChildProcesses)
    }
    selectStartFile() {
        let w = remote.BrowserWindow.getFocusedWindow();
        if (w == null)
            throw new Error("Get focused window fail.");

        remote.dialog.showOpenDialog(w, {}).then(r => {
            if (r.filePaths != null && r.filePaths.length > 0) {
                let command = r.filePaths[0];

                this.onCommandChanged(command);
            }
        });
    }
    onCommandChanged(value: string) {
        let { cwd, log, defaultCWD, defaultLOG } = this.state;
        if (defaultCWD) {
            cwd = path.dirname(value);
        }
        if (defaultLOG) {
            log = value + ".log";
        }
        this.setState({ command: value, cwd, log })

    }
    render() {
        let { startupPrograms, defaultCWD, command, cwd, defaultLOG, log } = this.state;

        return <>
            <div className="form-horizontal" ref={e => this.formElement = e || this.formElement}>
                <div className="form-group" >
                    <div className="col-xs-12">
                        <div className="pull-left">
                            <label>执行命令</label>
                        </div>
                        <div style={{ marginLeft: 90 }} >
                            <div className="input-group">
                                <input name={COMMAND} className="form-control" value={command || ""}
                                    onChange={e => this.onCommandChanged(e.target.value)}
                                    placeholder="请输入或选择要运行的命令" />
                                <div className="input-group-addon" title="请选择要启动的文件"
                                    onClick={() => this.selectStartFile()}>
                                    <i className="glyphicon glyphicon-level-up" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="form-group">
                    <div className="col-xs-12">
                        <div className="pull-left">
                            <label>执行目录</label>
                        </div>
                        <div style={{ marginLeft: 90 }} >
                            <input name={CWD} className="form-control" readOnly={defaultCWD} value={cwd || ""}
                                onChange={e => {
                                    cwd = e.target.value;
                                    this.setState({ cwd });
                                }} />
                            <div className="checkbox">
                                <label>
                                    <input type="checkbox" checked={defaultCWD}
                                        onChange={e => {
                                            defaultCWD = e.target.checked;
                                            this.setState({ defaultCWD });
                                        }} />默认
                                </label>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="form-group">
                    <div className="col-xs-12">
                        <div className="pull-left">
                            <label>日志文件</label>
                        </div>
                        <div style={{ marginLeft: 90 }} >
                            <input className="form-control" readOnly={defaultLOG} value={log || ""}
                                onChange={e => {
                                    log = e.target.value;
                                    this.setState({ log });
                                }} />
                            <div className="checkbox">
                                <label>
                                    <input type="checkbox" checked={defaultLOG}
                                        onChange={e => {
                                            defaultLOG = e.target.checked;
                                            this.setState({ defaultLOG })
                                        }} />默认
                                </label>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="form-group">
                    <div className="col-xs-12">
                        <div style={{ marginLeft: 90 }} >
                            <button className="btn btn-default" style={{ width: 80 }}
                                ref={e => {
                                    if (!e) return
                                    buttonOnClick(e, () => this.addItem())
                                }}>
                                <i className="glyphicon glyphicon-plus" style={{ marginRight: 6 }} />
                                <span>添加</span>
                            </button>
                        </div>
                    </div>
                </div>
                <hr />
                <div>
                    <div style={{ width: "100%" }} className="clearfix">
                        <div style={Object.assign({ width: programTextStyle.width } as Partial<CSSProperties>, programTitleStyle)} className="pull-left">
                            执行命令
                        </div>
                        <div style={Object.assign({ width: programTextStyle.width } as Partial<CSSProperties>, programTitleStyle)} className="pull-left">
                            执行目录
                        </div>
                        <div style={Object.assign({ width: programTextStyle.width } as Partial<CSSProperties>, programTitleStyle)} className="pull-left">
                            日志
                        </div>
                        <div style={Object.assign({ width: programButtonsWidth } as Partial<CSSProperties>, programTitleStyle)} className="pull-left">
                            操作
                        </div>
                    </div>
                    {startupPrograms.map((o, i) =>
                        <div key={i} style={{ width: "100%" }} className="clearfix">
                            <div style={programTextStyle} className="pull-left" title={o.command}>
                                {o.command}
                            </div>
                            <div style={programTextStyle} className="pull-left" title={o.cwd}>
                                {o.cwd}
                            </div>
                            <div style={programTextStyle} className="pull-left" title={o.log}>
                                {o.log}
                            </div>
                            <div style={{ width: 160, textAlign: "center" }} className="pull-left">
                                <button className="btn btn-danger btn-sm" style={{ marginRight: 5 }}
                                    onClick={() => this.deleteItem(i)}>删除</button>
                                <button className="btn btn-primary btn-sm"
                                    onClick={() => this.executeItem(o)}>运行</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    }
}

let mainElement = document.getElementById('main')
ReactDOM.render(<MainView />, mainElement)