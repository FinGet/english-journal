# 发布文案与飞书交付

每期最终交付位于output/epXX/，包含video.mp4、cover.png、post.md。post.md可直接复制用于抖音发布：一个20字符以内的中文标题，空一行后接一小段中文文案。

## 文案来源

读取本期完整且已核对的口播，提炼主线、真实情绪与具体经历。标题可沿用用户确认的封面主题，正文自然、简短，不堆标签，不编造经历或夸大结论。不能只拼接字幕或用固定套话当成每期文案。

将文案写入本期motion.json：

```json
{
  "publication": {
    "title": "AI 蠢到让人抓狂",
    "body": "让 AI 帮我剪视频，本来想要惊喜，结果等来的是惊吓。效率它能提，真正的创造力呢？这期英语口语练习，聊聊我被 AI 折腾后的想法。"
  }
}
```

标题按Unicode字符计数，空格、标点和英文字母都计入20字符限制；正文一段，最多300字符。生成命令：

```sh
npm run post -- --episode 10 --edition talkcraft
```

生成格式为Markdown一级标题、空行、正文。旧文案改变时备份至本期work/previous-exports。publication是生成源；修改文案时先改它再生成。正式视频导出前要求已填写publication，成功导出后自动同步post.md；单独导出封面时若已有publication也会同步文案。它不会调用外部模型或触发飞书发送。

## 飞书配置

发送实现独立位于scripts/publish-feishu.mjs，使用Node自带fetch/FormData，无其他业务项目依赖。凭据仅通过本项目.env或shell环境配置：

```dotenv
FEISHU_APP_ID=your_app_id
FEISHU_APP_SECRET=your_app_secret
JOURNAL_FEISHU_CHAT_ID=oc_your_journal_group_id
```

本机可沿用已配置的应用凭据，不要将密钥复制进源码、日志或Git。需要将该应用的机器人加入journal群。若不指定群ID，客户端分页查询机器人所在的群，选择唯一同名journal；找不到或同名多个时停止。只接受JOURNAL_FEISHU_CHAT_ID或显式--chat-id覆盖目标，不继承其他工具的通用FEISHU_CHAT_ID。

只读查找journal（不发送）：

```sh
npm run publish:feishu -- --list-chats
```

本地检查（不联网、不发送；遵循当前验证授权）：

```sh
npm run publish:feishu -- --out output/ep10 --check
```

用户要求发送后执行：

```sh
npm run publish:feishu -- --out output/ep10
```

命令检查三份成品、标题/正文、有效音视频与时长；先上传封面和视频，素材均上传成功后发“标题＋文案＋封面”卡片，再发可播放视频。预览、渲染和文案生成都不自动发群，也不自动重渲染已有视频。

## 大小与失败处理

参考机器人文件接口的30 MB大小阈值，封面需小于10 MB；默认仍直接尝试上传原片，以当前服务器实际返回为准，不根据历史阈值提前缩分辨率或压码率。若服务器拒绝原片，停止并说明实际原因，不自动降画质重试。正式video.mp4始终保留，可改用支持原文件大小的客户端或已授权的云空间交付。云空间方案需要相应应用权限和可访问的文件夹，不能假定机器人上传权限等于云空间权限，也不能改成公开链接来绕开授权。

只有用户明确要求小体积预览时，才使用：

```sh
npm run publish:feishu -- --out output/ep10 --preview
```

该选项在超限时生成宽度不超过1080px、保持比例的压缩预览，采用两遍编码并检查实际大小、时长和音轨，卡片标题明确标记“预览版”。口播和音效不另做增益处理，正式video.mp4保持不变。预览副本及发送记录存output/_work/epXX/feishu/；它不作为抖音上传成片。过长而无法合理压缩的视频会停止，不截断内容。

上传失败不会先发卡片。卡片与视频消息分步记录消息ID，人工重试可以续发未完成部分；发送记录和去重包含三份成品及实际上传视频的哈希，预览版和原片分别记录。token仅在内存中使用；发送记录不保存token或应用密钥。群消息没有跨消息事务，若卡片已成功而视频失败，应按记录续发，不能宣称两条消息都已完成。

接口依据：[飞书上传文件](https://open.feishu.cn/document/server-docs/im-v1/file/create)、[获取用户或机器人所在群列表](https://open.feishu.cn/document/server-docs/group/chat/list)、[发送消息](https://open.feishu.cn/document/server-docs/im-v1/message/create)。发送顺序参考过expression-video-agent，Journal实现不在运行时读取它。
