# GooseDuckGoose Django API

一个极简计数后端，用 SQLite 记录每次游戏分数，并返回排行榜所需数据。

## 运行

```bash
cd backend
python -m venv .venv
. .venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver 0.0.0.0:8000
```

前端默认请求同源 `/api/results/`。如果静态页面和 API 不同源，可在 `index.html` 引入 `app.js` 之前设置：

```html
<script>window.GDG_API_BASE = "http://localhost:8000";</script>
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
