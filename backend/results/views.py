import json

from django.db.models import Count, Sum
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_GET, require_POST

from .models import GameResult


def stats_for(score, total):
    rows = GameResult.objects.filter(total=total).values("score").annotate(count=Count("id"))
    distribution = {str(i): 0 for i in range(total + 1)}
    for row in rows:
        distribution[str(row["score"])] = row["count"]

    total_players = sum(distribution.values())
    beaten_count = sum(count for bucket, count in distribution.items() if int(bucket) < score)
    higher_count = sum(count for bucket, count in distribution.items() if int(bucket) > score)

    return {
        "score": score,
        "total": total,
        "total_players": total_players,
        "beaten_count": beaten_count,
        "rank": higher_count + 1,
        "distribution": distribution,
    }


@csrf_exempt
@require_POST
def submit_result(request):
    try:
        payload = json.loads(request.body or b"{}")
        score = int(payload.get("score"))
        total = int(payload.get("total", 6))
    except (TypeError, ValueError, json.JSONDecodeError):
        return JsonResponse({"error": "score and total must be integers"}, status=400)

    if total < 1 or total > 50 or score < 0 or score > total:
        return JsonResponse({"error": "invalid score range"}, status=400)

    GameResult.objects.create(score=score, total=total)
    return JsonResponse(stats_for(score, total), status=201)


@require_GET
def leaderboard(request):
    try:
        total = int(request.GET.get("total", 6))
        score = int(request.GET.get("score", total))
    except ValueError:
        return JsonResponse({"error": "total and score must be integers"}, status=400)

    if total < 1 or total > 50:
        return JsonResponse({"error": "invalid total"}, status=400)
    score = min(max(score, 0), total)
    return JsonResponse(stats_for(score, total))
