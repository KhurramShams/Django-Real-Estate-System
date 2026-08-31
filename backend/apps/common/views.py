"""
Common views including system health check.
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from django.db import connection
import time


class HealthCheckView(APIView):
    """
    Health check endpoint for monitoring, load balancers, and frontend connectivity tests.
    Exposed at /api/v1/health/
    """

    permission_classes = [AllowAny]

    def get(self, request):
        db_status = "healthy"
        db_response_time_ms = None

        start_time = time.time()
        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1;")
                cursor.fetchone()
            db_response_time_ms = round((time.time() - start_time) * 1000, 2)
        except Exception as exc:
            db_status = f"unhealthy: {str(exc)}"

        is_healthy = "unhealthy" not in db_status
        status_code = status.HTTP_200_OK if is_healthy else status.HTTP_503_SERVICE_UNAVAILABLE

        return Response(
            {
                "status": "healthy" if is_healthy else "degraded",
                "service": "Real Estate Management System API",
                "version": "1.0.0",
                "database": {
                    "status": db_status,
                    "response_time_ms": db_response_time_ms,
                    "engine": connection.vendor,
                },
                "timestamp": time.time(),
            },
            status=status_code,
        )
