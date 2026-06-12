# Generated for GooseDuckGoose simple leaderboard backend.

from django.db import migrations, models


class Migration(migrations.Migration):
    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name="GameResult",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("score", models.PositiveSmallIntegerField()),
                ("total", models.PositiveSmallIntegerField(default=6)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
            ],
            options={"ordering": ["-created_at"]},
        ),
        migrations.AddIndex(
            model_name="gameresult",
            index=models.Index(fields=["total", "score"], name="results_gam_total_d422f7_idx"),
        ),
    ]
