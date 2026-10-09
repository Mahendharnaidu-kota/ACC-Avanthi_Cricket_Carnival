"""Dependency-free, per-process rate limiting for sensitive public endpoints."""

from collections import defaultdict, deque
from threading import Lock
from time import monotonic

from fastapi import HTTPException, Request, status


class RateLimit:
    """Allow a bounded number of requests from each client IP per time window."""

    def __init__(self, max_requests: int = 60, window_seconds: int = 60) -> None:
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self._requests: dict[str, deque[float]] = defaultdict(deque)
        self._lock = Lock()

    def __call__(self, request: Request) -> None:
        client_ip = request.client.host if request.client else "unknown"
        now = monotonic()
        cutoff = now - self.window_seconds

        with self._lock:
            timestamps = self._requests[client_ip]
            while timestamps and timestamps[0] <= cutoff:
                timestamps.popleft()

            if len(timestamps) >= self.max_requests:
                retry_after = max(1, int(self.window_seconds - (now - timestamps[0])))
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail="Too many requests. Please try again shortly.",
                    headers={"Retry-After": str(retry_after)},
                )

            timestamps.append(now)
