#!/usr/bin/env python3
"""Rebuild SecureNow /al-ui-rate Phase 1 markdown rollups from artifact JSON (rate-only)."""

from __future__ import annotations

import json
import os
import subprocess
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parents[2]
ART = Path(os.environ.get("SECURENOW_UI_RATE_ARTIFACTS", "/opt/cursor/artifacts"))

AGENT_TAGS = {
    "bc-cff05a7f-7d2c-5fe6-a3fe-eebdd0124004": "batch 1 (batch B deep)",
    "bc-7bbdb19f-12f5-5156-b9b7-ee7ac09ade84": "batch 1 (recapture deep)",
}


def load(name: str) -> dict:
    return json.loads((ART / name).read_text(encoding="utf-8"))


def main() -> int:
    if not ART.is_dir():
        print(f"Missing artifacts dir: {ART}", file=sys.stderr)
        return 1

    required = [
        "securenow-rate-batch-1-ratings.json",
        "securenow-rate-batch-0-ratings.json",
        "securenow-rate-batch-2-ratings.json",
        "securenow-rate-batches-3-6-consolidated-ratings.json",
    ]
    for name in required:
        if not (ART / name).is_file():
            print(f"Missing {ART / name}", file=sys.stderr)
            return 1

    b1 = load("securenow-rate-batch-1-ratings.json")
    layers = [
        ("batch 2", load("securenow-rate-batch-2-ratings.json")),
        ("batch 0", load("securenow-rate-batch-0-ratings.json")),
        ("batch 3–6", load("securenow-rate-batches-3-6-consolidated-ratings.json")),
        ("batch 1", b1),
    ]
    scores: dict[str, dict] = {}
    batch_tag: dict[str, str] = {}
    for tag, doc in layers:
        for r in doc.get("ratings", []):
            scores[r["href"]] = r
            batch_tag[r["href"]] = AGENT_TAGS.get(r.get("ratedBy"), tag)

    routes = json.loads(
        subprocess.check_output(
            [sys.executable, str(REPO / "scripts/ci/list-securenow-ui-rate-routes.py"), "--json"],
            text=True,
        )
    )
    wb_lines = subprocess.check_output(
        [sys.executable, str(REPO / "scripts/ci/securenow-ui-rate-workbook-lookup.py")],
        text=True,
    ).strip().splitlines()
    wb: dict[str, tuple[str, str, str]] = {}
    for line in wb_lines[2:]:
        if not line.strip().startswith("|"):
            continue
        parts = [p.strip() for p in line.split("|") if p.strip()]
        if len(parts) >= 4:
            wb[parts[0].strip("`")] = (parts[1], parts[2], parts[3])

    rows: list[tuple] = []
    pending: list[str] = []
    for route in routes:
        href = route["href"]
        wid, ux_w, ev_w = wb.get(href, ("—", "—", "—"))
        s = scores.get(href)
        if not s:
            pending.append(href)
            rows.append((href, wid, ux_w, ev_w, "pending", "pending", "pending"))
            continue
        rows.append((href, wid, ux_w, ev_w, s["ux_current"], s["evidence_current"], batch_tag.get(href, "?")))

    def fmt(v: object) -> str:
        return "—" if v in (None, "", "—") else str(v)

    scored = [r for r in rows if r[0] in scores]
    ux_mean = sum(scores[r[0]]["ux_current"] for r in scored) / max(len(scored), 1)
    ev_mean = sum(scores[r[0]]["evidence_current"] for r in scored) / max(len(scored), 1)
    p0_sum = sum(scores[r[0]].get("p0_count", 0) for r in scored)

    header_deliverable = (
        "# SecureNow UI rate — Phase 1 score deliverable (`--rate-only`)\n\n"
        f"**Routes:** 112 · **Scored:** {112 - len(pending)} · **Pending:** {len(pending)}\n\n"
        f"**Opus means (current):** UX {ux_mean:.1f} · Evidence {ev_mean:.1f} · **P0 items (sum):** {p0_sum}\n\n"
        "_Regenerate: `python scripts/ci/rollup-securenow-ui-rate-phase1.py` "
        "(set `SECURENOW_UI_RATE_ARTIFACTS` if not `/opt/cursor/artifacts`)._\n\n"
    )
    header_summary = (
        "# SecureNow /al-ui-rate score rollup (`--rate-only`)\n\n"
        f"**Coverage:** {112 - len(pending)}/112 scored.\n\n"
    )
    table = (
        "| Path | Workbook ID | UX (wb) | Ev (wb) | Opus UX | Opus Ev | Batch |\n"
        "| --- | --- | --- | --- | --- | --- | --- |\n"
    )
    for href, wid, ux_w, ev_w, ux_o, ev_o, tag in rows:
        table += f"| `{href}` | {wid} | {fmt(ux_w)} | {fmt(ev_w)} | {ux_o} | {ev_o} | {tag} |\n"

    (ART / "securenow-ui-rate-phase1-deliverable.md").write_text(header_deliverable + table, encoding="utf-8")
    (ART / "securenow-ui-rate-score-summary.md").write_text(header_summary + table, encoding="utf-8")
    print(f"Wrote rollups to {ART} (UX {ux_mean:.1f}, Ev {ev_mean:.1f}, P0 sum {p0_sum})")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
