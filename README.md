# 用于启动程序

## 使用
1.  将要启动的程序(文件夹)放在 bin 目录下,并在程序文件夹下 startup.json5 配置文件。

配置文件如下

```json
{
    "main": "mgrok.exe",            // 要启动的程序
    "args": ["-log=stdout", "80"],  // 启动程序时传递的参数
}
```
 
1. 运行 run.vbs 文件