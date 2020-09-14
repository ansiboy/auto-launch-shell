type StartupProgram = {
    command: string,
    cwd: string,
    log?: string,
    /** 守护进程，程序关闭后自动重启 */
    guard?: boolean,
}