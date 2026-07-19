#!/usr/bin/env python3
"""Post-rollback runtime BUILD_ID checks (API /version + optional UI public shell)."""

from __future__ import annotations

import argparse
import json
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

_CI_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(_CI_DIR))

from cd_post_deploy_product_smoke import (  # noqa: E402
    PUBLIC_SHELL_SMOKE_PATH,
    cache_bypass_request_headers,
)
from cd_rollback import verify_runtime_build_id, verify_ui_public_shell_build_id  # noqa: E402


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--api-base-url", required=True)
    parser.add_argument("--expected-build-id", required=True)
    parser.add_argument("--ui-base-url", default="")
    parser.add_argument("--timeout-seconds", type=float, default=60.0)
    return parser.parse_args(argv)


def _http_get(url: str, *, timeout: float, headers: dict[str, str]) -> tuple[int, str]:
    request = urllib.request.Request(url, headers=headers, method="GET")

    try:
        with urllib.request.urlopen(request, timeout=timeout) as response:
            body = response.read().decode("utf-8", errors="replace")
            return int(response.status), body
    except urllib.error.HTTPError as exc:
        body = exc.read().decode("utf-8", errors="replace") if exc.fp is not None else ""
        return int(exc.code), body
    except urllib.error.URLError:
        return 0, ""


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv)
    api_base = args.api_base_url.rstrip("/")
    expected = args.expected_build_id.strip()

    live_code, _ = _http_get(
        f"{api_base}/health/live",
        timeout=args.timeout_seconds,
        headers={"Accept": "application/json"},
    )
    ready_code, _ = _http_get(
        f"{api_base}/health/ready",
        timeout=args.timeout_seconds,
        headers={"Accept": "application/json"},
    )
    version_code, version_body = _http_get(
        f"{api_base}/version",
        timeout=args.timeout_seconds,
        headers={"Accept": "application/json"},
    )

    if live_code != 200 or ready_code != 200:
        print(
            f"ERROR: health checks failed (live={live_code}, ready={ready_code})",
            file=sys.stderr,
        )
        return 1

    observed_api = ""

    if version_code == 200 and version_body.strip():
        try:
            payload = json.loads(version_body)
            if isinstance(payload, dict):
                value = payload.get("commitSha")
                if isinstance(value, str):
                    observed_api = value
        except json.JSONDecodeError:
            observed_api = ""

    api_ok, api_reason = verify_runtime_build_id(expected=expected, observed=observed_api)
    print(f"API: {api_reason} (HTTP {version_code})")

    if not api_ok:
        print(f"ERROR: {api_reason}", file=sys.stderr)
        return 1

    ui_base = (args.ui_base_url or "").strip().rstrip("/")

    if not ui_base:
        print("UI: skipped (no --ui-base-url)")
        return 0

    cache_bust = f"{PUBLIC_SHELL_SMOKE_PATH}?_shell_smoke={int(time.time())}"
    ui_code, ui_body = _http_get(
        f"{ui_base}{cache_bust}",
        timeout=args.timeout_seconds,
        headers=cache_bypass_request_headers(accept="text/html"),
    )

    if ui_code != 200:
        print(f"ERROR: UI public shell HTTP {ui_code}", file=sys.stderr)
        return 1

    ui_ok, ui_reason = verify_ui_public_shell_build_id(expected=expected, html=ui_body)
    print(f"UI: {ui_reason}")

    if not ui_ok:
        print(f"ERROR: {ui_reason}", file=sys.stderr)
        return 1

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
