from django.conf import settings


class SimpleCorsMiddleware:
    """Small CORS middleware for the static frontend hosted on a separate URL."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if request.method == "OPTIONS":
            from django.http import HttpResponse
            response = HttpResponse(status=204)
        else:
            response = self.get_response(request)

        origin = request.headers.get("Origin")
        allowed_origins = settings.CORS_ALLOWED_ORIGINS
        if "*" in allowed_origins:
            response["Access-Control-Allow-Origin"] = "*"
        elif origin in allowed_origins:
            response["Access-Control-Allow-Origin"] = origin
            response["Vary"] = "Origin"

        response["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
        response["Access-Control-Allow-Headers"] = "Content-Type"
        return response
