# 用于开机启动程序

注：仅适用于 windows 64 位操作系统

## 使用

1.  在 bin 目录下,添加 commands.json 配置文件。

    示例：

    ```json
    [
        {
            "command": "pm2 start mgrokd.exe",
            "cwd": "mgrokd",
            "log": "mgrokd.log"
        },
        {
            "command": "pm2 mgrok.exe -- -log=stdout 80",
            "cwd": "mgrok",
            "log": "mgrok.log"
        },
        {
            "command": "start nginx",
            "cwd": "C:/nginx-1.15.10"
        }
    ]
    ```

    **参数**

    1. command: 为启动时执行的命令
    1. cwd: 为执行目录
    1. log: 为日志文件名称，日志文件保存在 bin 目录下
 
1. 运行 run.vbs 文件