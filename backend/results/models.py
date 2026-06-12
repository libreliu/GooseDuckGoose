from django.db import models


class GameResult(models.Model):
    score = models.PositiveSmallIntegerField()
    total = models.PositiveSmallIntegerField(default=6)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [models.Index(fields=["total", "score"])]
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.score}/{self.total} @ {self.created_at:%Y-%m-%d %H:%M:%S}"
