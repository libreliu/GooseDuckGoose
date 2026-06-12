# GooseDuckGoose Django API

一个极简计数后端，用 SQLite 记录每次游戏分数，并返回排行榜所需数据。生产部署推荐 Docker Compose + Caddy：API 使用独立域名，Caddy 自动申请和续期 HTTPS 证书。

## Docker Compose 部署

1. 准备 DNS：把 API 独立域名，例如 `api.example.com`，解析到服务器公网 IP。
2. 创建环境文件：

```bash
cd backend
cp .env.example .env
```

3. 编辑 `.env`：

```dotenv
API_DOMAIN=api.example.com
DJANGO_SECRET_KEY=换成随机长密钥
DJANGO_DEBUG=false
DJANGO_ALLOWED_HOSTS=api.example.com
CORS_ALLOWED_ORIGINS=https://你的前端域名
GUNICORN_WORKERS=2
```

生成 Django secret：

```bash
python -c 'from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())'
```

4. 启动：

```bash
docker compose up -d --build
```

服务说明：

- `api`：Django + Gunicorn，只在 compose 内网暴露 `8000`。
- `caddy`：监听宿主机 `80/443`，为 `API_DOMAIN` 自动签发证书，并把 `/api/*` 反代到 Django。
- SQLite 数据保存在 Docker volume `gdg_sqlite`。

> 当前运行环境没有 Docker，所以这里未执行 compose 测试。

## 本地 Python 运行

```bash
cd backend
python -m venv .venv
. .venv/bin/activate
pip install -r requirements.txt
export DJANGO_SECRET_KEY=dev-secret
export DJANGO_DEBUG=true
export DJANGO_ALLOWED_HOSTS=localhost,127.0.0.1
export CORS_ALLOWED_ORIGINS=*
python manage.py migrate
python manage.py runserver 0.0.0.0:8000
```

## 前端连接独立 API URL

前端默认请求同源 `/api/results/`。生产环境如果后端 API 是独立 URL，编辑项目根目录 `config.js`：

```js
window.GDG_API_BASE = "https://api.example.com";
```

## API

### POST `/api/results/`

请求：

```json
{ "score": 4, "total": 6 }
```

响应：

```json
{
  "score": 4,
  "total": 6,
  "total_players": 23,
  "beaten_count": 17,
  "rank": 3,
  "distribution": { "0": 0, "1": 1, "2": 2, "3": 14, "4": 3, "5": 2, "6": 1 }
}
```

### GET `/api/leaderboard/?total=6&score=4`

只读取统计，不新增记录。
