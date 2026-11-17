# 源码仓库

仓库：git@github.com:FinGet/english-journal.git。

提交工程源码、配置模板、文档、许可证、字体、互动SVG图标和跨期共用音效。原片、public/epXX的单期制作数据、模型缓存、环境密钥、node_modules和output工作产物留在本地，不加入Git。

新机器使用：

```sh
git clone git@github.com:FinGet/english-journal.git
cd english-journal
npm ci
npm run setup
```

依赖锁文件不记录本地业务项目路径或node_modules软链接，新机器正常安装本仓库依赖。本机的依赖、语音模型和降噪工具已从已有文件复制到本工程，不再通过相邻项目软链接运行。迁移记录留在output/_work/environment-migration/，不进入Git。

setup只补缺失配置和目录；导入真实素材后再在浏览器预览。语音模型、Python及DeepFilterNet的独立准备方式见[environment.md](environment.md)，脚本不会在后台下载。完整制作标准保存在本仓库，不要求另一业务项目或历史聊天；来源说明只在provenance.md和licenses中保留。Git提交与推送不代表已经完成测试、试听或渲染。
