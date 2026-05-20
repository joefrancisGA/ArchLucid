#!/usr/bin/env python3
"""Templates-pack agent evaluation harness.

Two modes, sharing the scenario + rubric schema in tests/eval-corpus/templates-pack/:

    capture  Run each scenario's inputSource template through a live ArchLucid API
             (POST /v1/architecture/request -> execute -> poll -> harvest findings),
             then save the flattened findings to scenario.recording so subsequent
             runs can score them deterministically.

    score    Load each scenario's recorded findings and apply expectedFindings /
             unexpectedFindings rules with the negation guard from rubric.json.
             Emits a per-scenario report to stdout (and optional markdown). When
             --enforce is passed AND rubric.enforceByDefault is true, exits 1 if
             any scenario fails the recall floor or trips an unexpected hit;
             otherwise always exits 0 (inform-only).

Use --enforce in nightly / RC jobs once the first inform-only baseline confirms
the scenarios match actual agent behaviour. PR CI should run in score mode
without --enforce until then.
"""

from __future__ import annotations

import argparse
import json
import os
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Iterable, Mapping, Sequence


REPO_ROOT: Path = Path(__file__).resolve().parents[2]
PACK_DIR: Path = REPO_ROOT / "tests" / "eval-corpus" / "templates-pack"
RUBRIC_PATH: Path = PACK_DIR / "rubric.json"


SEVERITY_RANK: dict[str, int] = {
    "critical": 40,
    "high": 30,
    "medium": 20,
    "low": 10,
    "informational": 5,
    "info": 5,
}


def _norm_severity(raw: str | None) -> int:
    if raw is None:
        return 0

    return SEVERITY_RANK.get(str(raw).strip().lower(), 10)


def _read_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def _write_json(path: Path, payload: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")


@dataclass
class Rubric:
    recall_floor_pct: int
    unexpected_hit_max: int
    severity_rule: str
    negation_guard_enabled: bool
    negation_tokens: list[str]
    negation_lookback_tokens: int
    enforce_by_default: bool

    @staticmethod
    def from_dict(d: Mapping[str, Any]) -> "Rubric":
        return Rubric(
            recall_floor_pct=int(d.get("recallFloorPct", 70)),
            unexpected_hit_max=int(d.get("unexpectedHitMax", 0)),
            severity_rule=str(d.get("severityRule", "gte")),
            negation_guard_enabled=bool(d.get("negationGuardEnabled", True)),
            negation_tokens=[str(t).lower() for t in (d.get("negationTokens") or [])],
            negation_lookback_tokens=int(d.get("negationLookbackTokens", 5)),
            enforce_by_default=bool(d.get("enforceByDefault", False)),
        )


def load_rubric(path: Path = RUBRIC_PATH) -> Rubric:
    return Rubric.from_dict(_read_json(path))


@dataclass
class Scenario:
    id: str
    title: str
    input_source: Path
    recording: Path
    expected: list[dict[str, Any]]
    unexpected: list[dict[str, Any]]
    raw: dict[str, Any] = field(repr=False, default_factory=dict)

    @staticmethod
    def from_path(path: Path) -> "Scenario":
        d = _read_json(path)
        input_source = REPO_ROOT / str(d["inputSource"])
        recording = REPO_ROOT / str(d["recording"])
        meta = d.get("metadata") or {}
        title = str(meta.get("title") or d["id"])
        return Scenario(
            id=str(d["id"]),
            title=title,
            input_source=input_source,
            recording=recording,
            expected=list(d.get("expectedFindings") or []),
            unexpected=list(d.get("unexpectedFindings") or []),
            raw=d,
        )


def list_scenarios(pack_dir: Path = PACK_DIR) -> list[Scenario]:
    paths = sorted(pack_dir.glob("scenario-*.json"))
    return [Scenario.from_path(p) for p in paths]


def _combined_text(finding: Mapping[str, Any]) -> str:
    parts = [
        str(finding.get("category") or ""),
        str(finding.get("severity") or ""),
        str(finding.get("title") or ""),
        str(finding.get("detail") or finding.get("description") or ""),
    ]
    return " ".join(parts).strip().lower()


def _category_matches(actual: str | None, expected: str | None) -> bool:
    if expected is None:
        return True

    return (actual or "").strip().lower() == str(expected).strip().lower()


def _severity_ok(actual: str | None, minimum: str | None) -> bool:
    return _norm_severity(actual) >= _norm_severity(minimum)


_TOKEN_SPLIT_RE = re.compile(r"\s+")


def _negation_violates(text: str, anchor: str, rubric: Rubric) -> bool:
    """True when every occurrence of `anchor` in `text` is preceded by a negation
    token within `negation_lookback_tokens`. False when at least one occurrence
    is clean (or when the guard is disabled / anchor is absent).
    """
    if not rubric.negation_guard_enabled:
        return False

    needle = anchor.lower()
    idx = text.find(needle)

    if idx < 0:
        return False

    while idx >= 0:
        prefix = text[:idx].strip()
        tokens = _TOKEN_SPLIT_RE.split(prefix) if prefix else []
        window = tokens[-rubric.negation_lookback_tokens:] if tokens else []
        negated = any(tok in rubric.negation_tokens for tok in window)

        if not negated:
            return False

        idx = text.find(needle, idx + len(needle))

    return True


def expected_satisfied(
    findings: Sequence[Mapping[str, Any]],
    rule: Mapping[str, Any],
    rubric: Rubric,
) -> tuple[bool, str]:
    """Return (hit, findingId). All anchors must appear in one finding text; negation guard applies per anchor."""
    anchors = [str(p).strip().lower() for p in (rule.get("evidenceMustContain") or []) if str(p).strip()]

    if not anchors:
        return False, "(rule missing evidenceMustContain)"

    want_cat = str(rule.get("category") or "").strip() or None
    min_sev = str(rule.get("minimumSeverity") or "low")

    for finding in findings:
        if not _category_matches(str(finding.get("category") or ""), want_cat):
            continue

        if not _severity_ok(str(finding.get("severity") or ""), min_sev):
            continue

        text = _combined_text(finding)

        if not all(a in text for a in anchors):
            continue

        if any(_negation_violates(text, a, rubric) for a in anchors):
            continue

        return True, str(finding.get("findingId") or "(no id)")

    return False, ""


def unexpected_triggered(
    findings: Sequence[Mapping[str, Any]],
    rule: Mapping[str, Any],
) -> tuple[bool, str]:
    needles = [str(p).strip().lower() for p in (rule.get("ifContainsAny") or []) if str(p).strip()]

    if not needles:
        return False, ""

    want_cat = str(rule.get("category") or "").strip() or None

    for finding in findings:
        if want_cat is not None and not _category_matches(str(finding.get("category") or ""), want_cat):
            continue

        text = _combined_text(finding)

        if any(n in text for n in needles):
            return True, str(finding.get("findingId") or "(no id)")

    return False, ""


@dataclass
class ScenarioScore:
    scenario_id: str
    title: str
    expected_total: int
    expected_hits: int
    expected_misses: list[str]
    unexpected_hits: list[str]
    recall_pct: float
    recall_floor_pct: int
    passes_recall: bool
    has_no_unexpected: bool
    error: str | None = None

    @property
    def passed(self) -> bool:
        return self.error is None and self.passes_recall and self.has_no_unexpected


def score_scenario(scenario: Scenario, rubric: Rubric) -> ScenarioScore:
    if not scenario.recording.exists():
        return ScenarioScore(
            scenario_id=scenario.id,
            title=scenario.title,
            expected_total=len(scenario.expected),
            expected_hits=0,
            expected_misses=[r.get("id", "(no id)") for r in scenario.expected],
            unexpected_hits=[],
            recall_pct=0.0,
            recall_floor_pct=rubric.recall_floor_pct,
            passes_recall=False,
            has_no_unexpected=True,
            error=f"recording missing: {scenario.recording.relative_to(REPO_ROOT)}",
        )

    findings = _load_findings(scenario.recording)
    hits = 0
    misses: list[str] = []

    for rule in scenario.expected:
        ok, _ = expected_satisfied(findings, rule, rubric)

        if ok:
            hits += 1
            continue

        misses.append(str(rule.get("id") or "(no id)"))

    unexpected_hits: list[str] = []

    for rule in scenario.unexpected:
        tripped, evidence_id = unexpected_triggered(findings, rule)

        if tripped:
            label = f"{rule.get('category', '?')}:{evidence_id}"
            unexpected_hits.append(label)

    total = len(scenario.expected)
    recall = (hits / total * 100.0) if total > 0 else 100.0
    passes_recall = recall + 1e-9 >= rubric.recall_floor_pct
    has_no_unexpected = len(unexpected_hits) <= rubric.unexpected_hit_max

    return ScenarioScore(
        scenario_id=scenario.id,
        title=scenario.title,
        expected_total=total,
        expected_hits=hits,
        expected_misses=misses,
        unexpected_hits=unexpected_hits,
        recall_pct=recall,
        recall_floor_pct=rubric.recall_floor_pct,
        passes_recall=passes_recall,
        has_no_unexpected=has_no_unexpected,
    )


def _load_findings(path: Path) -> list[dict[str, Any]]:
    blob = _read_json(path)

    if isinstance(blob, list):
        return [f for f in blob if isinstance(f, dict)]

    findings = blob.get("findings") if isinstance(blob, dict) else None

    if isinstance(findings, list):
        return [f for f in findings if isinstance(f, dict)]

    return []


def _format_summary(scores: Iterable[ScenarioScore]) -> str:
    lines: list[str] = []
    lines.append("# Templates-pack eval harness — score report")
    lines.append("")
    lines.append(f"Generated: {time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())}")
    lines.append("")
    lines.append("| Scenario | Recall | Floor | Unexpected | Status |")
    lines.append("|----------|--------|-------|-----------|--------|")

    pass_count = 0
    total_count = 0

    for s in scores:
        total_count += 1

        if s.passed:
            pass_count += 1
            status = "PASS"
        elif s.error:
            status = f"ERROR ({s.error})"
        elif not s.passes_recall:
            status = "FAIL (recall)"
        else:
            status = "FAIL (unexpected)"

        recall = f"{s.expected_hits}/{s.expected_total} ({s.recall_pct:.0f}%)"
        unexp = f"{len(s.unexpected_hits)} hit(s)" if s.unexpected_hits else "0"
        lines.append(f"| `{s.scenario_id}` | {recall} | {s.recall_floor_pct}% | {unexp} | {status} |")

    lines.append("")
    lines.append(f"**Summary:** {pass_count}/{total_count} scenarios passed.")
    lines.append("")
    lines.append("## Per-scenario details")

    for s in scores:
        lines.append("")
        lines.append(f"### {s.scenario_id} — {s.title}")

        if s.error:
            lines.append(f"- error: {s.error}")
            continue

        lines.append(f"- recall: {s.expected_hits}/{s.expected_total} ({s.recall_pct:.0f}%) — floor {s.recall_floor_pct}%")

        if s.expected_misses:
            lines.append("- missed MUST themes:")
            for m in s.expected_misses:
                lines.append(f"  - `{m}`")

        if s.unexpected_hits:
            lines.append("- unexpected hits:")
            for u in s.unexpected_hits:
                lines.append(f"  - `{u}`")

    return "\n".join(lines)


def run_score_mode(args: argparse.Namespace) -> int:
    rubric = load_rubric()
    scenarios = list_scenarios()

    if not scenarios:
        print("[eval-harness] No scenarios found in tests/eval-corpus/templates-pack/", file=sys.stderr)
        return 1

    scores = [score_scenario(s, rubric) for s in scenarios]
    report = _format_summary(scores)
    print(report)

    if args.report:
        report_path = Path(args.report)
        report_path.parent.mkdir(parents=True, exist_ok=True)
        report_path.write_text(report + "\n", encoding="utf-8")
        print(f"\n[eval-harness] Report saved: {report_path}", file=sys.stderr)

    any_failed = any(not s.passed for s in scores)
    enforce_now = args.enforce or rubric.enforce_by_default

    if enforce_now and any_failed:
        return 1

    return 0


def _http_post(url: str, body: Any, headers: Mapping[str, str], timeout: int) -> dict[str, Any]:
    data = None if body is None else json.dumps(body).encode("utf-8")
    hdrs = {"Content-Type": "application/json", "Accept": "application/json"}
    hdrs.update(headers)
    req = urllib.request.Request(url=url, data=data, headers=hdrs, method="POST")

    with urllib.request.urlopen(req, timeout=timeout) as resp:
        payload = resp.read().decode("utf-8")

        if not payload:
            return {}

        return json.loads(payload)


def _http_get(url: str, headers: Mapping[str, str], timeout: int) -> dict[str, Any]:
    hdrs = {"Accept": "application/json"}
    hdrs.update(headers)
    req = urllib.request.Request(url=url, headers=hdrs, method="GET")

    with urllib.request.urlopen(req, timeout=timeout) as resp:
        payload = resp.read().decode("utf-8")
        return json.loads(payload) if payload else {}


def _auth_headers() -> dict[str, str]:
    headers: dict[str, str] = {}
    token = os.environ.get("ARCHLUCID_BEARER_TOKEN", "").strip()

    if token:
        headers["Authorization"] = f"Bearer {token}"

    api_key = os.environ.get("ARCHLUCID_API_KEY", "").strip()

    if api_key:
        headers["X-Api-Key"] = api_key

    return headers


def _real_mode_headers(real_mode: bool) -> dict[str, str]:
    if not real_mode:
        return {}

    return {"X-ArchLucid-Pilot-Real-Mode": "true"}


def _flatten_findings(detail: Mapping[str, Any]) -> list[dict[str, Any]]:
    results = detail.get("results") or []
    findings: list[dict[str, Any]] = []

    for r in results:
        if not isinstance(r, dict):
            continue

        for f in (r.get("findings") or []):
            if isinstance(f, dict):
                findings.append(f)

    return findings


def capture_one(scenario: Scenario, base_url: str, timeout_s: int, poll_s: int, real_mode: bool) -> str | None:
    if not scenario.input_source.exists():
        return f"input source missing: {scenario.input_source.relative_to(REPO_ROOT)}"

    payload = _read_json(scenario.input_source)
    auth = _auth_headers()
    real = _real_mode_headers(real_mode)

    try:
        create_resp = _http_post(f"{base_url.rstrip('/')}/v1/architecture/request", payload, auth, timeout_s)
    except urllib.error.HTTPError as e:
        return f"POST /v1/architecture/request failed: HTTP {e.code} {e.reason}"
    except (urllib.error.URLError, TimeoutError, ConnectionError) as e:
        return f"POST /v1/architecture/request failed: {e}"

    run = (create_resp or {}).get("run") or {}
    run_id = str(run.get("runId") or "").strip()

    if not run_id:
        return f"create response missing run.runId; got keys={list((create_resp or {}).keys())}"

    execute_url = f"{base_url.rstrip('/')}/v1/architecture/run/{urllib.parse.quote(run_id, safe='')}/execute"
    poll_url = f"{base_url.rstrip('/')}/v1/architecture/run/{urllib.parse.quote(run_id, safe='')}"

    try:
        _http_post(execute_url, None, {**auth, **real}, timeout_s)
    except (urllib.error.URLError, urllib.error.HTTPError, TimeoutError, ConnectionError):
        pass

    deadline = time.monotonic() + timeout_s
    detail: dict[str, Any] = {}
    last_status: str = ""

    while time.monotonic() < deadline:
        try:
            detail = _http_get(poll_url, auth, timeout_s)
        except (urllib.error.URLError, urllib.error.HTTPError, TimeoutError, ConnectionError) as e:
            return f"poll {poll_url} failed: {e}"

        run_block = detail.get("run") or {}
        last_status = str(run_block.get("status") or "")

        if last_status == "ReadyForCommit":
            break

        if last_status == "Failed":
            return f"run {run_id} entered Failed status"

        time.sleep(poll_s)

    if last_status != "ReadyForCommit":
        return f"timed out after {timeout_s}s (lastStatus={last_status or '?'})"

    findings = _flatten_findings(detail)

    if not findings:
        return f"run {run_id} reached ReadyForCommit but produced 0 findings"

    payload_out = {"findings": findings, "capturedFromRunId": run_id}
    _write_json(scenario.recording, payload_out)
    return None


def run_capture_mode(args: argparse.Namespace) -> int:
    if not args.base_url:
        print("[eval-harness] --base-url is required in capture mode", file=sys.stderr)
        return 2

    scenarios = list_scenarios()
    failures: list[tuple[str, str]] = []

    for s in scenarios:
        print(f"[capture] {s.id} ← {s.input_source.relative_to(REPO_ROOT)}", file=sys.stderr)
        err = capture_one(
            scenario=s,
            base_url=args.base_url,
            timeout_s=args.timeout,
            poll_s=args.poll_interval,
            real_mode=args.real_mode,
        )

        if err is None:
            print(f"  → {s.recording.relative_to(REPO_ROOT)} saved", file=sys.stderr)
            continue

        failures.append((s.id, err))
        print(f"  → ERROR: {err}", file=sys.stderr)

    if failures:
        print(f"\n[capture] {len(failures)} scenario(s) failed to capture", file=sys.stderr)
        return 1

    print(f"\n[capture] {len(scenarios)} scenario(s) captured.", file=sys.stderr)
    return 0


def _parse_args(argv: Sequence[str] | None = None) -> argparse.Namespace:
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument(
        "--mode",
        choices=["capture", "score"],
        default="score",
        help="capture findings from a live API, or score committed recordings.",
    )
    p.add_argument(
        "--base-url",
        default=os.environ.get("ARCHLUCID_API_BASE_URL", "").strip() or None,
        help="API base URL (capture mode). Falls back to ARCHLUCID_API_BASE_URL.",
    )
    p.add_argument(
        "--timeout",
        type=int,
        default=300,
        help="seconds to wait for ReadyForCommit per scenario (capture mode).",
    )
    p.add_argument(
        "--poll-interval",
        type=int,
        default=3,
        help="seconds between status polls (capture mode).",
    )
    p.add_argument(
        "--real-mode",
        action="store_true",
        help="forward the pilot real-mode header on execute (capture mode).",
    )
    p.add_argument(
        "--enforce",
        action="store_true",
        help="exit 1 on any score failure (otherwise inform-only).",
    )
    p.add_argument(
        "--report",
        default=None,
        help="optional markdown report output path (score mode).",
    )
    return p.parse_args(argv)


def main(argv: Sequence[str] | None = None) -> int:
    args = _parse_args(argv)

    if args.mode == "capture":
        return run_capture_mode(args)

    return run_score_mode(args)


if __name__ == "__main__":
    raise SystemExit(main())
