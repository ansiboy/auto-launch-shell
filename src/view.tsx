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

const COMMAND = 'command'
const CWD = 'cwd'

// let commandsFile = path.join(binPath, 'commands.json')
let commandsFilePath = path.join(remote.app.getAppPath(), constants.binPath, constants.commandsFile)
interface State {
    startupPrograms: (StartupProgram & { status?: 'start' | 'stop' })[],
    defaultCWD: boolean,
    command?: string,
    cwd?: string,
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
        this.state = { startupPrograms, defaultCWD: true }
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
        let { startupPrograms, command, cwd } = this.state;
        startupPrograms.push({ command: command || "", cwd: cwd || "" });
        this.setState({ startupPrograms });
        let text = JSON.stringify(startupPrograms);
        fs.writeFileSync(commandsFilePath, text);
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
                let cwd = this.state.defaultCWD ? path.dirname(command) : this.state.cwd;
                this.setState({ command, cwd });
            }
        });
    }
    render() {
        let { startupPrograms, defaultCWD, command, cwd } = this.state;
        if (defaultCWD && command != null && path.isAbsolute(command)) {
            cwd = path.dirname(command);
        }

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
                                    onChange={e => {
                                        this.setState({ command: e.target.value })
                                    }} />
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
                            <input name={CWD} className="form-control" readOnly={defaultCWD} value={cwd || ""} />
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
                <table className="table table-striped">
                    <thead>
                        <tr>
                            <th>执行命令</th>
                            <th>执行目录</th>
                            {/* <th style={{ width: 80 }}>状态</th> */}
                        </tr>
                    </thead>
                    <tbody>
                        {startupPrograms.map((o, i) =>
                            <tr key={i}>
                                <td>{o.command}</td>
                                <td>{o.cwd}</td>
                                {/* <td className={o.status == 'start' ? "text-success" : "text-danger"}>
                                    {o.status == 'start' ? '已启动' : '未启动'}
                                </td> */}
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </>
    }
}

let mainElement = document.getElementById('main')
ReactDOM.render(<MainView />, mainElement)