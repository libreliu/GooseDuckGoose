# GooseDuckGoose
猜猜我是鹅腿还是鸭腿

一个受“鹅腿阿姨”饭点话题启发的小网页游戏：看一张菜品照片，判断主角到底是鹅还是鸭，最后得到分数和错题复盘。

## 运行

在项目目录里启动任意静态服务器，然后打开 `index.html`。

```powershell
python -m http.server 4173
```

浏览器访问 `http://localhost:4173/`。

## 分享页与排行榜

答完一局后会进入可截图分享页：包含分数、打败人数、名次、分数分布，以及 6 道题的对错缩略图。移动端样式压缩到一屏内，方便直接截图。

前端会向 `/api/results/` 提交 `{ score, total }` 获取排行榜统计；如果 API 不可用，会自动退回到浏览器本地计数，方便纯静态预览。

Django 后端在 `backend/`，支持 Docker Compose + Caddy 部署到独立 API 域名，并用 `.env` 管理 secret：

```bash
cd backend
cp .env.example .env
# 编辑 .env：API_DOMAIN、DJANGO_SECRET_KEY、DJANGO_ALLOWED_HOSTS、CORS_ALLOWED_ORIGINS
docker compose up -d --build
```

Caddy 会监听 80/443，为 `API_DOMAIN` 自动签发和续期 HTTPS 证书，并把 `/api/*` 反代到 Django。

若前端和后端不同源，编辑根目录 `config.js`：

```js
window.GDG_API_BASE = "https://api.example.com";
```

更多后端说明见 `backend/README.md`。

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
