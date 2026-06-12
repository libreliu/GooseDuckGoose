from django.urls import path
from results.views import leaderboard, submit_result

urlpatterns = [
    path("api/results/", submit_result, name="submit-result"),
    path("api/leaderboard/", leaderboard, name="leaderboard"),
]
