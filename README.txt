Amy 画展网页

打开方式：
现在已经升级成 Railway 可部署版本。
本地预览请双击 启动本地服务器.bat，然后打开：
http://localhost:3000

注意：
不要再双击 script.js。现在作品信息由 data/artworks.json 保存，后台上传会自动更新。

公开画展：
http://localhost:3000

上传入口：
http://localhost:3000/admin.html

默认本地密码：
amy-gallery

双人展厅：
上传时可以选择作者 Amy 或 Nancy。系统会按作者自动命名和加入对应作品墙。
首页默认显示全部作者的前 12 张作品，作品多时点击“加载更多”继续查看。
管理密码会保存在当前浏览器，下次打开上传页不用重复输入。

Railway 上请设置环境变量：
ADMIN_PASSWORD=你自己的密码
OPENAI_API_KEY=你的 OpenAI API Key

详细部署步骤见：
RAILWAY部署说明.txt
