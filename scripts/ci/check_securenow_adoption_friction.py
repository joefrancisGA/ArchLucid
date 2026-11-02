#!/usr/bin/env python3
"""Validate SecureNow first-hour materials remain honest and buyer-safe."""

from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]

FIRST_HOUR = Path("docs/securenow/FIRST_HOUR.md")
HOME_COPY = Path("archlucid-ui/src/lib/product-line/securenow-first-hour-home-copy.ts")
OPERATOR_COPY = Path("archlucid-ui/src/lib/product-line/securenow-first-hour-copy.ts")
OPERATOR_PAGE = Path(
    "archlucid-ui/src/app/(operator)/administration/securenow-first-hour/SecureNowFirstHourPageView.tsx"
)
ENVIRONMENT_CONTEXT = Path("archlucid-ui/src/components/product-line/SecureNowHomeEnvironmentContext.tsx")

FORBIDDEN = (
    "minutes to value",
    "autonomous remediation",
    "breach prevention",
    "automatically fix azure",
    "guaranteed savings",
)

EXPECTED_HOME_ROWS = (
    ("Scope and freshness", "/integrations/cloud-connections"),
    ("One ranked path", "/security/remediation-factory"),
    ("Path inspect", "/administration/securenow-first-hour#path-inspect"),
    ("Stop", "/administration/securenow-first-hour#stop"),
    ("First hour page", "/administration/securenow-first-hour"),
)
HOME_ROW_PATTERN = re.compile(
    r'\{\s*href:\s*(?P<href>[^,\n]+),\s*label:\s*"(?P<label>[^"]+)"',
    re.MULTILINE,
)
HOME_ROWS_ARRAY_PATTERN = re.compile(
    r"export const SECURENOW_FIRST_HOUR_HOME_ROWS[^=]*=\s*\[",
    re.MULTILINE,
)


def _read(root: Path, relative: Path, errors: list[str]) -> str:
    path = root / relative
    if not path.is_file():
        errors.append(f"missing {relative}")
        return ""
    return path.read_text(encoding="utf-8")

def _home_rows_initializer(text: str) -> str:
    """Return the bracket-balanced body of the SECURENOW_FIRST_HOUR_HOME_ROWS array."""
    array_match = HOME_ROWS_ARRAY_PATTERN.search(text)
    if array_match is None:
        return ""
    depth = 1
    index = array_match.end()
    while index < len(text):
        char = text[index]
        if text.startswith("//", index):
            newline = text.find("\n", index + 2)
            index = len(text) if newline == -1 else newline
            continue
        if text.startswith("/*", index):
            end = text.find("*/", index + 2)
            index = len(text) if end == -1 else end + 2
            continue
        if char in "\"'`":
            quote = char
            index += 1
            while index < len(text):
                if text[index] == "\\":
                    index += 2
                elif text[index] == quote:
                    index += 1
                    break
                else:
                    index += 1
            continue
        if char == "[":
            depth += 1
        elif char == "]":
            depth -= 1
            if depth == 0:
                return text[array_match.end() : index]
        index += 1
    return ""


def _strip_comments(text: str) -> str:
    """Remove // and /* */ comments while preserving string literal contents."""
    pieces: list[str] = []
    index = 0
    while index < len(text):
        char = text[index]
        following = text[index + 1] if index + 1 < len(text) else ""
        if char == "/" and following == "/":
            newline = text.find("\n", index)
            index = len(text) if newline == -1 else newline
        elif char == "/" and following == "*":
            end = text.find("*/", index + 2)
            index = len(text) if end == -1 else end + 2
        else:
            pieces.append(char)
            if char in "\"`":
                quote = char
                index += 1
                while index < len(text) and text[index] != quote:
                    pieces.append(text[index])
                    if text[index] == "\\" and index + 1 < len(text):
                        pieces.append(text[index + 1])
                        index += 2
                    else:
                        index += 1
                if index < len(text):
                    pieces.append(text[index])
            index += 1
    return "".join(pieces)


def _parse_home_rows(text: str) -> list[tuple[str, str]]:
    operator_path_match = re.search(
        r'export const SECURENOW_FIRST_HOUR_OPERATOR_PATH = "([^"]+)"',
        _strip_comments(text),
    )
    operator_path = operator_path_match.group(1) if operator_path_match else None
    rows: list[tuple[str, str]] = []

    initializer = _strip_comments(_home_rows_initializer(text))
    for match in HOME_ROW_PATTERN.finditer(initializer):
        href_expression = match.group("href").strip()
        if href_expression.startswith('"') and href_expression.endswith('"'):
            href = href_expression[1:-1]
        elif href_expression == "SECURENOW_FIRST_HOUR_OPERATOR_PATH" and operator_path is not None:
            href = operator_path
        else:
            href = href_expression
        rows.append((match.group("label"), href))

    return rows


def validate(root: Path = ROOT) -> list[str]:
    errors: list[str] = []
    first_hour = _read(root, FIRST_HOUR, errors)
    home_copy = _read(root, HOME_COPY, errors)
    operator_copy = _read(root, OPERATOR_COPY, errors)
    operator_page = _read(root, OPERATOR_PAGE, errors)
    environment_context = _read(root, ENVIRONMENT_CONTEXT, errors)

    if first_hour:
        for token in (
            "NO_GO",
            "Scope and freshness",
            "One ranked path",
            "Advisory cut point",
            "NOT VERIFIED",
            "/security/remediation-factory",
            "/administration/securenow-first-hour",
            "Path inspect",
            "Select a priority row",
        ):
            if token not in first_hour:
                errors.append(f"{FIRST_HOUR}: missing {token!r}")
        if "$" in first_hour:
            errors.append(f"{FIRST_HOUR}: contains '$'")

    if home_copy:
        for token in (
            "Start here",
            "NO_GO",
            "A missing or stale capture is the current step",
            "A blank ranking is not a clean result",
            "Scope and freshness",
            "One ranked path",
            "Path inspect",
            "Stop",
            "First hour page",
            "/integrations/cloud-connections",
            "/security/remediation-factory",
            "/administration/securenow-first-hour#path-inspect",
            "/administration/securenow-first-hour#stop",
            "/administration/securenow-first-hour",
        ):
            if token not in home_copy:
                errors.append(f"{HOME_COPY}: missing {token!r}")
        home_rows = _parse_home_rows(home_copy)
        if home_rows != list(EXPECTED_HOME_ROWS):
            errors.append(f"{HOME_COPY}: Home row label-to-href assignments are out of order or incorrect")
        if len({href for _, href in home_rows}) != len(home_rows):
            errors.append(f"{HOME_COPY}: Home rows must have distinct href values")

    if operator_copy:
        for token in ("NO_GO", "NOT VERIFIED", "does not change Azure", "Advisory cut point"):
            if token not in operator_copy:
                errors.append(f"{OPERATOR_COPY}: missing {token!r}")
        step_three = operator_copy.split('title: "3 — Advisory cut point"', 1)
        if len(step_three) == 2:
            step_three_body = step_three[1].split('title: "4 — Stop"', 1)[0]
            if "Path inspect" not in step_three_body or "Select a priority row" not in step_three_body:
                errors.append(f"{OPERATOR_COPY}: step 3 missing Path inspect selection wording")
            if "SECURENOW_REMEDIATION_FACTORY_PATH" in step_three_body or '"/security/remediation-factory"' in step_three_body:
                errors.append(f"{OPERATOR_COPY}: step 3 reuses the remediation factory href")
        else:
            errors.append(f"{OPERATOR_COPY}: missing step 3")

    if operator_page and "securenow-first-hour-page" not in operator_page:
        errors.append(f"{OPERATOR_PAGE}: missing page test id")
    for token in ('"path-inspect"', '"stop"'):
        if operator_page and token not in operator_page:
            errors.append(f"{OPERATOR_PAGE}: missing id {token}")

    if environment_context:
        for token in ("No collection yet", "/integrations/cloud-connections"):
            if token not in environment_context:
                errors.append(f"{ENVIRONMENT_CONTEXT}: missing {token!r}")

    catalog = _read(root, Path("archlucid-ui/src/lib/product-line/product-line-catalog.ts"), errors)
    if catalog and '"/administration/securenow-first-hour": "security"' not in catalog:
        errors.append("product-line-catalog.ts: missing securenow-first-hour security assignment")

    for relative, text in (
        (FIRST_HOUR, first_hour),
        (HOME_COPY, home_copy),
        (OPERATOR_COPY, operator_copy),
        (OPERATOR_PAGE, operator_page),
    ):
        lowered = text.lower()
        for phrase in FORBIDDEN:
            if phrase in lowered:
                errors.append(f"{relative}: contains forbidden phrase {phrase!r}")
        if "$" in text:
            errors.append(f"{relative}: contains '$'")

    return errors


def main() -> int:
    errors = validate()
    for error in errors:
        print(error)
    if errors:
        return 1
    print("SecureNow adoption friction: PASS")
    return 0


if __name__ == "__main__":
    sys.exit(main())
