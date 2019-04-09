import React = require('react')
import ReactDOM = require('react-dom')
import { FormValidator, rules as r } from 'maishu-dilu'
import { errors } from './errors';
import { buttonOnClick } from 'maishu-ui-toolkit'
// import { commandsFilePath, StartupProgram, childProcesses } from './run-startup-file'
import fs = require('fs')
import path = require('path')
import { ChildProcess } from 'child_process';
import { remote, ipcRenderer } from 'electron';
import { constants } from './common';

const command = 'command'
const cwd = 'cwd'

// let commandsFile = path.join(binPath, 'commands.json')
let commandsFilePath = path.join(remote.app.getAppPath(), constants.binPath, constants.commandsFile)
interface State {
    startupPrograms: (StartupProgram & { status?: 'start' | 'stop' })[]
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
        this.state = { startupPrograms }
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
    }
    componentDidMount() {
        if (!this.formElement) throw errors.objectIsNull('formElement')
        this.validator = new FormValidator(this.formElement,
            { name: command, rules: [r.required('请输入执行命令')] },
            { name: cwd, rules: [r.required('请输入执行目录')] }
        )

        // childProcesses.add((items) => {
        //     this.updateStatus(items)
        // })
        // this.updateStatus(childProcesses.value)
        ipcRenderer.on(constants.childProcessesChanged, (event: any, value: { [key: string]: ChildProcess }) => {
            this.updateStatus(value)
        })
        ipcRenderer.send(constants.getChildProcesses)
    }
    render() {
        let { startupPrograms } = this.state
        return <>
            <div className="form-horizontal" ref={e => this.formElement = e || this.formElement}>
                <div className="pull-right">
                    <button className="btn btn-default" style={{ width: 80 }}
                        ref={e => {
                            if (!e) return
                            buttonOnClick(e, () => this.addItem())
                        }}>
                        <i className="glyphicon glyphicon-plus" style={{ marginRight: 6 }} />
                        <span>添加</span>
                    </button>
                </div>
                <div className="form-group" style={{ marginRight: 90 }}>
                    <div className="col-xs-6">
                        <div className="pull-left">
                            <label>执行命令</label>
                        </div>
                        <div style={{ marginLeft: 90 }} >
                            <input name={command} className="form-control" />
                        </div>
                    </div>
                    <div className="col-xs-6">
                        <div className="pull-left">
                            <label>执行目录</label>
                        </div>
                        <div style={{ marginLeft: 90 }} >
                            <input name={cwd} className="form-control" />
                        </div>
                    </div>
                </div>
                <hr />
                <table className="table table-striped">
                    <thead>
                        <tr>
                            <th>执行命令</th>
                            <th>执行目录</th>
                            <th style={{ width: 80 }}>状态</th>
                        </tr>
                    </thead>
                    <tbody>
                        {startupPrograms.map((o, i) =>
                            <tr key={i}>
                                <td>{o.command}</td>
                                <td>{o.cwd}</td>
                                <td className={o.status == 'start' ? "text-success" : "text-danger"}>
                                    {o.status == 'start' ? '已启动' : '未启动'}
                                </td>
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