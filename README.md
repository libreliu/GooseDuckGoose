# GooseDuckGoose
猜猜我是鹅腿还是鸭腿

一个受“鹅腿阿姨”饭点话题启发的小网页游戏：看一张菜品照片，判断主角到底是鹅还是鸭，最后得到分数和错题复盘。

## 运行

在项目目录里启动任意静态服务器，然后打开 `index.html`。

```powershell
python -m http.server 4173
```

浏览器访问 `http://localhost:4173/`。

## 分享页

答完一局后会进入结果分享页：包含分数、正确率、题数、当前结果 URL、二维码，以及 6 道题的对错缩略图。移动端样式压缩到一屏内，方便直接截图。

## 图片来源

游戏图片已下载到 `assets/`。本地文件名、答案、题目描述和来源说明记录在 `assets/sources.json`。`downloadUrl` 和 `sourceUrl` 可以填写，但不是必填字段。

## 添加新题目

1. 把新图片放到 `assets/`。
2. 在 `assets/sources.json` 增加一条记录，填写 `id`、`title`、`answer`、`file`、`clue` 和 `provider`。如果图片来自网页，也可以补充 `downloadUrl` 和 `sourceUrl`。
3. 运行校验：

```powershell
node scripts/validate-assets.js
```

每局会从题库里随机抽取最多 6 道题。
