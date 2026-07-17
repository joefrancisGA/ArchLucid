#!/usr/bin/env python3
"""Send the daily App Insights digest via ACS Email (preferred) or SMTP."""

from __future__ import annotations

import argparse
import json
import os
import smtplib
import subprocess
import sys
from email.message import EmailMessage
from pathlib import Path
from typing import Any
from urllib import error, request

_CI_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(_CI_DIR))

from app_insights_daily_error_telemetry import render_email_subject  # noqa: E402


ACS_API_VERSION = "2023-03-31"
ACS_TOKEN_RESOURCE = "https://communication.azure.com"


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--report-json", type=Path, required=True)
    parser.add_argument("--markdown-path", type=Path, required=True)
    parser.add_argument("--to", type=str, default=None, help="Recipient email (or env APP_INSIGHTS_REPORT_EMAIL_TO)")
    parser.add_argument(
        "--only-when-new",
        action="store_true",
        help="Skip send when the report has zero new signatures",
    )
    parser.add_argument(
        "--provider",
        choices=("auto", "acs", "smtp", "noop"),
        default="auto",
        help="Email transport (auto prefers ACS when endpoint+sender are configured)",
    )
    return parser.parse_args(argv)


def load_report(path: Path) -> dict[str, Any]:
    payload = json.loads(path.read_text(encoding="utf-8-sig"))

    if not isinstance(payload, dict):
        raise SystemExit(f"Report JSON must be an object: {path}")

    return payload


def resolve_recipient(explicit: str | None) -> str:
    value = (explicit or os.environ.get("APP_INSIGHTS_REPORT_EMAIL_TO", "")).strip()

    if not value:
        raise SystemExit("Recipient required: --to or APP_INSIGHTS_REPORT_EMAIL_TO")

    return value


def resolve_provider(requested: str) -> str:
    if requested != "auto":
        return requested

    acs_endpoint = os.environ.get("ACS_EMAIL_ENDPOINT", "").strip()
    acs_sender = os.environ.get("ACS_EMAIL_SENDER_ADDRESS", "").strip()

    if acs_endpoint and acs_sender:
        return "acs"

    smtp_host = os.environ.get("SMTP_HOST", "").strip()

    if smtp_host:
        return "smtp"

    return "noop"


def get_azure_access_token() -> str:
    env_token = os.environ.get("AZURE_ACCESS_TOKEN", "").strip()

    if env_token:
        return env_token

    completed = subprocess.run(
        [
            "az",
            "account",
            "get-access-token",
            "--resource",
            ACS_TOKEN_RESOURCE,
            "--query",
            "accessToken",
            "-o",
            "tsv",
        ],
        check=False,
        capture_output=True,
        text=True,
    )

    if completed.returncode != 0:
        raise SystemExit(
            "Could not obtain Azure access token for ACS Email. "
            f"az stderr: {completed.stderr.strip() or completed.stdout.strip()}"
        )

    token = completed.stdout.strip()

    if not token:
        raise SystemExit("Azure access token for ACS Email was empty.")

    return token


def send_via_acs(*, to_address: str, subject: str, plain_text: str, html_body: str) -> None:
    endpoint = os.environ.get("ACS_EMAIL_ENDPOINT", "").strip().rstrip("/")
    sender = os.environ.get("ACS_EMAIL_SENDER_ADDRESS", "").strip()

    if not endpoint or not sender:
        raise SystemExit("ACS email requires ACS_EMAIL_ENDPOINT and ACS_EMAIL_SENDER_ADDRESS")

    token = get_azure_access_token()
    url = f"{endpoint}/emails:send?api-version={ACS_API_VERSION}"
    body = {
        "senderAddress": sender,
        "content": {
            "subject": subject,
            "plainText": plain_text,
            "html": html_body,
        },
        "recipients": {
            "to": [{"address": to_address}],
        },
    }
    req = request.Request(
        url,
        data=json.dumps(body).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
        },
        method="POST",
    )

    try:
        with request.urlopen(req, timeout=60) as response:
            response.read()
    except error.HTTPError as http_error:
        detail = http_error.read().decode("utf-8", errors="replace")
        raise SystemExit(f"ACS Email send failed ({http_error.code}): {detail}") from http_error
    except error.URLError as url_error:
        raise SystemExit(f"ACS Email send failed: {url_error}") from url_error


def send_via_smtp(*, to_address: str, subject: str, plain_text: str, html_body: str) -> None:
    host = os.environ.get("SMTP_HOST", "").strip()
    port_raw = os.environ.get("SMTP_PORT", "587").strip()
    username = os.environ.get("SMTP_USERNAME", "").strip()
    password = os.environ.get("SMTP_PASSWORD", "")
    from_address = os.environ.get("SMTP_FROM_ADDRESS", username).strip()
    use_tls = os.environ.get("SMTP_USE_TLS", "true").strip().lower() not in {"0", "false", "no"}

    if not host or not from_address:
        raise SystemExit("SMTP email requires SMTP_HOST and SMTP_FROM_ADDRESS (or SMTP_USERNAME)")

    if username and not password:
        raise SystemExit(
            "SMTP_USERNAME is set but SMTP_PASSWORD is missing. "
            "Add dev environment secret SMTP_PASSWORD (Comcast/Xfinity mailbox password)."
        )

    try:
        port = int(port_raw)
    except ValueError as exc:
        raise SystemExit(f"Invalid SMTP_PORT: {port_raw}") from exc

    message = EmailMessage()
    message["Subject"] = subject
    message["From"] = from_address
    message["To"] = to_address
    message.set_content(plain_text)
    message.add_alternative(html_body, subtype="html")

    if use_tls:
        with smtplib.SMTP(host, port, timeout=60) as client:
            client.starttls()

            if username:
                client.login(username, password)

            client.send_message(message)
    else:
        with smtplib.SMTP(host, port, timeout=60) as client:
            if username:
                client.login(username, password)

            client.send_message(message)


def markdown_to_html(markdown_text: str) -> str:
    escaped = (
        markdown_text.replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
    )
    html_body = escaped.replace("\n", "<br/>\n")

    return f"<html><body style=\"font-family:Segoe UI,Arial,sans-serif;font-size:14px;\">{html_body}</body></html>"


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv)
    payload = load_report(args.report_json)
    markdown_text = args.markdown_path.read_text(encoding="utf-8")
    totals = payload.get("totals") or {}
    new_count = int(totals.get("newSignatureCount") or 0)

    if args.only_when_new and new_count == 0:
        print("Skip email: --only-when-new and report has zero new signatures.")
        return 0

    provider = resolve_provider(args.provider)

    if provider == "noop":
        print("Email provider noop — configure ACS_EMAIL_* or SMTP_* to enable delivery.")
        return 0

    to_address = resolve_recipient(args.to)
    subject = payload.get("emailSubject")

    if not isinstance(subject, str) or not subject.strip():
        subject = render_email_subject(payload)

    plain_text = markdown_text.replace("**", "")
    html_body = markdown_to_html(markdown_text)

    if provider == "acs":
        send_via_acs(to_address=to_address, subject=subject, plain_text=plain_text, html_body=html_body)
    elif provider == "smtp":
        send_via_smtp(to_address=to_address, subject=subject, plain_text=plain_text, html_body=html_body)
    else:
        raise SystemExit(f"Unsupported provider: {provider}")

    print(f"Sent App Insights daily digest to {to_address} via {provider}.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
