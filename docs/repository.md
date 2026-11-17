# 源码仓库

仓库：git@github.com:FinGet/english-journal.git。

提交工程源码、配置模板、文档、许可证、字体和跨期共用音效。原片、public/epXX的单期制作数据、模型缓存、环境密钥、node_modules和output工作产物留在本地，不加入Git。

新机器使用：

```sh
git clone git@github.com:FinGet/english-journal.git
cd english-journal
npm ci
npm run setup
```

依赖锁文件从独立临时目录解析生成，不记录本机ai-english-coach的node_modules软链接。本机继续复用已有依赖；新机器正常安装本仓库依赖。

setup只补缺失配置和目录；导入真实素材后再在浏览器预览。语音模型与DeepFilterNet仍需已有本地环境或显式路径，脚本不会在后台下载。Git提交与推送不代表已经完成测试、试听或渲染。
