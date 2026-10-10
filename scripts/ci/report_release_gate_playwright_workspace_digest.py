#!/usr/bin/env python3
"""Split RC release-gate Playwright JSON into Workspace A, Workspace B, and the first assertion.

The live UI job exits with one code for every `@release-gate` spec. This digest names which
demo workspace failed and prints the first assertion so the job annotation is readable
without downloading the HTML report. It always exits 0: the Playwright step owns pass/fail.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path

WORKSPACES = ("A", "B", "other")
FAILED_RESULT_STATUSES = {"failed", "timedOut", "interrupted"}
MAX_ASSERTION_CHARS = 500


def classify_workspace(spec_path: str) -> str:
    normalized = spec_path.replace("\\", "/").lower()

    if "demo-workspace-a" in normalized:
        return "A"

    if "demo-workspace-b" in normalized:
        return "B"

    return "other"


def repo_relative(path: str) -> str:
    normalized = path.replace("\\", "/")
    marker = "archlucid-ui/"
    index = normalized.find(marker)

    if index >= 0:
        return normalized[index:]

    return normalized.lstrip("/")


def empty_counts() -> dict[str, dict[str, int]]:
    return {workspace: {"passed": 0, "failed": 0, "flaky": 0, "skipped": 0} for workspace in WORKSPACES}


def iter_specs(suite: dict, inherited_file: str) -> list[dict]:
    file_name = str(suite.get("file") or inherited_file)
    found: list[dict] = []
    specs = suite.get("specs")

    if isinstance(specs, list):
        for spec in specs:
            if not isinstance(spec, dict):
                continue

            row = dict(spec)

            if not row.get("file"):
                row["file"] = file_name

            found.append(row)

    nested = suite.get("suites")

    if isinstance(nested, list):
        for child in nested:
            if isinstance(child, dict):
                found.extend(iter_specs(child, file_name))

    return found


def collect_specs(report: dict) -> list[dict]:
    suites = report.get("suites")

    if not isinstance(suites, list):
        return []

    found: list[dict] = []

    for suite in suites:
        if isinstance(suite, dict):
            found.extend(iter_specs(suite, ""))

    return found


def final_outcome(test: dict) -> str:
    status = str(test.get("status") or "")

    if status == "skipped":
        return "skipped"

    if status == "flaky":
        return "flaky"

    if status in {"unexpected", "failed"}:
        return "failed"

    results = test.get("results")

    if isinstance(results, list) and results:
        last = results[-1]

        if isinstance(last, dict) and str(last.get("status") or "") in FAILED_RESULT_STATUSES:
            return "failed"

    return "passed"


def failing_result(test: dict) -> dict | None:
    results = test.get("results")
    chosen: dict | None = None

    if not isinstance(results, list):
        return None

    for result in results:
        if not isinstance(result, dict):
            continue

        if str(result.get("status") or "") in FAILED_RESULT_STATUSES:
            chosen = result

    return chosen


def assertion_message(result: dict | None) -> str:
    if result is None:
        return "Playwright marked the test failed without an error payload."

    message = ""
    errors = result.get("errors")

    if isinstance(errors, list) and errors and isinstance(errors[0], dict):
        message = str(errors[0].get("message") or "")
    else:
        error = result.get("error")

        if isinstance(error, dict):
            message = str(error.get("message") or "")

    head = message.split("\nCall log:")[0].strip()
    collapsed = " ".join(head.split())

    if len(collapsed) > MAX_ASSERTION_CHARS:
        return collapsed[: MAX_ASSERTION_CHARS - 1] + "…"

    if collapsed:
        return collapsed

    return "Playwright marked the test failed without an assertion message."


def assertion_line(result: dict | None, spec: dict) -> int | None:
    if result is not None:
        errors = result.get("errors")

        if isinstance(errors, list) and errors and isinstance(errors[0], dict):
            location = errors[0].get("location")

            if isinstance(location, dict) and isinstance(location.get("line"), int):
                return int(location["line"])

    line = spec.get("line")

    if isinstance(line, int):
        return line

    return None


def build_digest(report: dict) -> dict[str, object]:
    counts = empty_counts()
    first_failure: dict[str, object] | None = None

    for spec in collect_specs(report):
        spec_file = repo_relative(str(spec.get("file") or ""))
        workspace = classify_workspace(spec_file)
        tests = spec.get("tests")

        if not isinstance(tests, list):
            continue

        for test in tests:
            if not isinstance(test, dict):
                continue

            outcome = final_outcome(test)
            counts[workspace][outcome] += 1

            if outcome != "failed" or first_failure is not None:
                continue

            result = failing_result(test)
            title = str(spec.get("title") or "").strip()
            project = str(test.get("projectName") or "").strip()
            first_failure = {
                "workspace": workspace,
                "file": spec_file,
                "line": assertion_line(result, spec),
                "title": title,
                "project": project,
                "message": assertion_message(result),
            }

    failed_total = sum(bucket["failed"] for bucket in counts.values())
    ran_total = sum(sum(bucket.values()) for bucket in counts.values())
    disposition = "FAIL" if failed_total > 0 else "PASS" if ran_total > 0 else "INCONCLUSIVE"
    note = ""

    if disposition == "INCONCLUSIVE":
        note = "Playwright JSON report contained no tests."

    return {
        "disposition": disposition,
        "note": note,
        "counts": counts,
        "firstFailure": first_failure,
    }


def empty_summary(disposition: str, note: str) -> dict[str, object]:
    return {
        "disposition": disposition,
        "note": note,
        "counts": empty_counts(),
        "firstFailure": None,
    }


def render_markdown(summary: dict[str, object]) -> str:
    counts = summary.get("counts")
    lines = [
        "# Release-gate workspace digest",
        "",
        f"**Disposition:** {summary.get('disposition')}",
        "",
    ]
    note = str(summary.get("note") or "").strip()

    if note:
        lines.extend([note, ""])

    lines.extend(
        [
            "| Workspace | Passed | Failed | Flaky | Skipped |",
            "| --- | ---: | ---: | ---: | ---: |",
        ]
    )

    if isinstance(counts, dict):

        for workspace in WORKSPACES:
            bucket = counts.get(workspace)

            if not isinstance(bucket, dict):
                continue

            lines.append(
                f"| {workspace} | {bucket.get('passed', 0)} | {bucket.get('failed', 0)} | {bucket.get('flaky', 0)} | {bucket.get('skipped', 0)} |"
            )

    failure = summary.get("firstFailure")
    lines.extend(["", "## First failing assertion", ""])

    if not isinstance(failure, dict):
        lines.append("None.")
        lines.append("")
        return "\n".join(lines)

    location = str(failure.get("file") or "")
    line = failure.get("line")

    if isinstance(line, int) and line > 0:
        location = f"{location}:{line}"

    lines.extend(
        [
            f"- **Workspace:** {failure.get('workspace')}",
            f"- **Test:** {failure.get('title')}",
            f"- **Location:** `{location}`",
            f"- **Message:** {failure.get('message')}",
            "",
        ]
    )
    return "\n".join(lines)


def format_github_annotation(failure: dict[str, object]) -> str:
    path = str(failure.get("file") or "archlucid-ui")
    workspace = str(failure.get("workspace") or "other")
    message = " ".join(str(failure.get("message") or "release-gate assertion failed").split())
    location = f"file={path}"
    line = failure.get("line")

    if isinstance(line, int) and line > 0:
        location = f"{location},line={line}"

    return f"::error {location},title=Workspace {workspace} release-gate::{message}"


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--json-in", type=Path, required=True)
    parser.add_argument("--markdown-out", type=Path, default=None)
    parser.add_argument("--json-out", type=Path, default=None)
    return parser.parse_args(argv)


def load_summary(path: Path) -> dict[str, object]:
    if not path.is_file():
        return empty_summary("INCONCLUSIVE", f"Playwright JSON report was not written: {path}")

    try:
        payload = json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        return empty_summary("INCONCLUSIVE", f"Playwright JSON report is not valid JSON: {exc}")

    if not isinstance(payload, dict):
        return empty_summary("INCONCLUSIVE", "Playwright JSON report root was not an object.")

    return build_digest(payload)


def write_outputs(summary: dict[str, object], markdown_out: Path | None, json_out: Path | None) -> None:
    if json_out is not None:
        json_out.parent.mkdir(parents=True, exist_ok=True)
        json_out.write_text(json.dumps(summary, indent=2) + "\n", encoding="utf-8")

    if markdown_out is not None:
        markdown_out.parent.mkdir(parents=True, exist_ok=True)
        markdown_out.write_text(render_markdown(summary), encoding="utf-8")


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv)
    summary = load_summary(args.json_in)
    write_outputs(summary, args.markdown_out, args.json_out)
    failure = summary.get("firstFailure")

    if summary.get("disposition") == "FAIL" and isinstance(failure, dict):
        print(format_github_annotation(failure))

    print(render_markdown(summary))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
