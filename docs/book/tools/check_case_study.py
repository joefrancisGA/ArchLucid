"""Sanitization check for the book's case-study appendix (Appendix D).

Scans a Markdown file for identifiers that must never be published (errors) and details
that need a human decision (review). With --publish, unfilled [[OWNER: ...]] placeholders
are errors too.

Usage:
    python docs/book/tools/check_case_study.py docs/book/appendices/d-case-study.md [--publish]

Exit code 1 when any error is found, otherwise 0. Review items never fail the run.
"""

import argparse
import ipaddress
import re
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Callable, Iterator

ERROR = "error"
REVIEW = "review"

GUID = re.compile(r"\b[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}\b")
IPV4 = re.compile(r"\b(?:\d{1,3}\.){3}\d{1,3}(?:/\d{1,2})?\b")
EMAIL = re.compile(r"\b[A-Za-z0-9._%+-]+@([A-Za-z0-9.-]+\.[A-Za-z]{2,})\b")
TENANT_DOMAIN = re.compile(r"\b[a-z0-9-]+\.onmicrosoft\.com\b", re.IGNORECASE)

# A named service endpoint ("acct.blob.core.windows.net") identifies a real resource.
# "privatelink" is the generic private DNS zone label, not a resource name.
SERVICE_ENDPOINT = re.compile(
    r"\b(?!privatelink\.)[a-z0-9-]+\.(?:blob|file|queue|table|dfs)\.core\.windows\.net\b"
    r"|\b[a-z0-9-]+\.(?:vault\.azure\.net|azurewebsites\.net|database\.windows\.net)\b",
    re.IGNORECASE,
)
BACKLOG_ID = re.compile(r"\b(?:SN|TB|FR)-\d+\b")
PRODUCT_NAME = re.compile(r"\b(?:SecureNow|ArchLucid)\b", re.IGNORECASE)
PERCENT = re.compile(r"\b\d+(?:\.\d+)?\s?%")
PLACEHOLDER = re.compile(r"\[\[OWNER\b")

ALLOWED_EMAIL_DOMAINS = {"example.com", "example.org", "example.net"}
DOCUMENTATION_NETWORKS = [
    ipaddress.ip_network("192.0.2.0/24"),
    ipaddress.ip_network("198.51.100.0/24"),
    ipaddress.ip_network("203.0.113.0/24"),
]


@dataclass(frozen=True)
class Finding:
    line: int
    level: str
    message: str


def parse_address(text: str) -> ipaddress.IPv4Address | None:
    """Return the address part of an IPv4 match, or None if it isn't a valid address."""
    try:
        return ipaddress.ip_address(text.split("/")[0])
    except ValueError:
        return None


def is_documentation_address(address: ipaddress.IPv4Address) -> bool:
    return any(address in network for network in DOCUMENTATION_NETWORKS)


def check_guids(line: str) -> Iterator[tuple[str, str]]:
    for match in GUID.finditer(line):
        yield ERROR, f"GUID {match.group(0)} (tenant, subscription, or object ID?)"


def check_addresses(line: str) -> Iterator[tuple[str, str]]:
    for match in IPV4.finditer(line):
        address = parse_address(match.group(0))

        if address is None or is_documentation_address(address):
            continue

        # Private ranges reveal topology rather than identity, so they need judgment, not a hard stop.
        if address.is_private:
            yield REVIEW, f"private address {match.group(0)}; keep only if a point needs it"
        else:
            yield ERROR, f"public IP address {match.group(0)}; use 192.0.2.0/24, 198.51.100.0/24, or 203.0.113.0/24"


def check_emails(line: str) -> Iterator[tuple[str, str]]:
    for match in EMAIL.finditer(line):
        if match.group(1).lower() not in ALLOWED_EMAIL_DOMAINS:
            yield ERROR, f"email address {match.group(0)}"


def check_domains(line: str) -> Iterator[tuple[str, str]]:
    for match in TENANT_DOMAIN.finditer(line):
        yield ERROR, f"tenant domain {match.group(0)}"

    for match in SERVICE_ENDPOINT.finditer(line):
        yield ERROR, f"named service endpoint {match.group(0)}"


def check_backlog_ids(line: str) -> Iterator[tuple[str, str]]:
    for match in BACKLOG_ID.finditer(line):
        yield ERROR, f"internal backlog ID {match.group(0)} (README IP boundary)"


def check_products(line: str) -> Iterator[tuple[str, str]]:
    for match in PRODUCT_NAME.finditer(line):
        yield REVIEW, f"product name {match.group(0)}; allowed only in the disclosed sidebar, never its internals"


def check_percentages(line: str) -> Iterator[tuple[str, str]]:
    for match in PERCENT.finditer(line):
        yield REVIEW, f"percentage {match.group(0).strip()}; needs an evidence register row"


Check = Callable[[str], Iterator[tuple[str, str]]]

CHECKS: list[Check] = [
    check_guids,
    check_addresses,
    check_emails,
    check_domains,
    check_backlog_ids,
    check_products,
    check_percentages,
]


def scan(text: str, publish: bool) -> list[Finding]:
    findings: list[Finding] = []

    for number, line in enumerate(text.splitlines(), start=1):
        findings.extend(Finding(number, level, message) for check in CHECKS for level, message in check(line))

        if publish and PLACEHOLDER.search(line):
            findings.append(Finding(number, ERROR, "unfilled [[OWNER: ...]] placeholder"))

    return findings


def count_placeholders(text: str) -> int:
    return len(PLACEHOLDER.findall(text))


def main(argv: list[str]) -> int:
    parser = argparse.ArgumentParser(description="Sanitization check for the case-study appendix.")
    parser.add_argument("path", type=Path)
    parser.add_argument("--publish", action="store_true", help="also fail on unfilled placeholders")
    args = parser.parse_args(argv)

    if not args.path.is_file():
        print(f"{args.path}: not found", file=sys.stderr)
        return 2

    text = args.path.read_text(encoding="utf-8")
    findings = scan(text, args.publish)

    for finding in findings:
        print(f"{args.path}:{finding.line}: {finding.level}: {finding.message}")

    errors = sum(1 for finding in findings if finding.level == ERROR)
    reviews = len(findings) - errors
    print(f"{errors} error(s), {reviews} review item(s), {count_placeholders(text)} placeholder(s) remaining")

    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
