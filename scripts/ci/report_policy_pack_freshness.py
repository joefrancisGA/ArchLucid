#!/usr/bin/env python3
"""Report policy-pack template freshness for CI and first-pilot proof (TB-123)."""

from __future__ import annotations

import argparse
import json
import sys
from datetime import date, datetime, timezone
from pathlib import Path

STALE_DAYS = 180
WARN_DAYS = 90


def parse_reviewed(value: str) -> date | None:
    text = value.strip()

    if not text:
        return None

    try:
        return date.fromisoformat(text[:10])
    except ValueError:
        return None


def pack_rows(root: Path) -> list[dict[str, object]]:
    packs_root = root / "templates" / "policy-packs"
    rows: list[dict[str, object]] = []
    today = datetime.now(timezone.utc).date()

    for pack_path in sorted(packs_root.glob("*/policy-pack.json")):
        document = json.loads(pack_path.read_text(encoding="utf-8"))
        manifest = document.get("packManifest") if isinstance(document.get("packManifest"), dict) else {}
        pack_id = pack_path.parent.name
        reviewed = parse_reviewed(str(manifest.get("lastReviewedUtc", "")))
        age_days: int | None = None
        freshness = "unknown"

        if reviewed is not None:
            age_days = (today - reviewed).days

            if age_days > STALE_DAYS:
                freshness = "stale"
            elif age_days > WARN_DAYS:
                freshness = "warn"
            else:
                freshness = "fresh"

        rules_path = pack_path.parent / "compliance-rules.json"
        rules_mtime = None

        if rules_path.is_file():
            rules_mtime = datetime.fromtimestamp(rules_path.stat().st_mtime, tz=timezone.utc).isoformat()

        rows.append(
            {
                "packId": str(manifest.get("id", pack_id)),
                "relativePath": str(pack_path.relative_to(root)).replace("\\", "/"),
                "owner": manifest.get("owner", ""),
                "lastReviewedUtc": manifest.get("lastReviewedUtc", ""),
                "scopeLabel": manifest.get("scopeLabel", ""),
                "buyerJob": manifest.get("buyerJob", ""),
                "ageDays": age_days,
                "freshness": freshness,
                "complianceRulesLastModifiedUtc": rules_mtime,
            },
        )

    return rows


def disposition_for_rows(rows: list[dict[str, object]]) -> str:
    if any(row.get("freshness") == "stale" for row in rows):
        return "HOLD"

    if any(row.get("freshness") in {"warn", "unknown"} for row in rows):
        return "WARN"

    return "PASS"


def render_markdown(payload: dict[str, object]) -> str:
    disposition = str(payload.get("disposition", "WARN"))
    lines = [
        "# Policy pack freshness report",
        "",
        f"**Disposition:** **{disposition}**",
        f"**Pack count:** {payload.get('packCount', 0)}",
        "",
        "| Pack | Owner | Last reviewed | Freshness | Scope |",
        "| --- | --- | --- | --- | --- |",
    ]

    for row in payload.get("packs") or []:
        if not isinstance(row, dict):
            continue

        lines.append(
            "| "
            + " | ".join(
                [
                    str(row.get("packId", "")),
                    str(row.get("owner", "")).replace("|", "/"),
                    str(row.get("lastReviewedUtc", "")),
                    str(row.get("freshness", "")),
                    str(row.get("scopeLabel", "")),
                ],
            )
            + " |",
        )

    lines.extend(
        [
            "",
            "Stale threshold: >180 days since `lastReviewedUtc`. Warn: >90 days.",
            "",
        ],
    )

    return "\n".join(lines)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--repo-root", type=Path, default=Path(__file__).resolve().parents[2])
    parser.add_argument("--json-out", type=Path)
    parser.add_argument("--markdown-out", type=Path)
    args = parser.parse_args()

    root = args.repo_root.resolve()
    rows = pack_rows(root)

    if not rows:
        print(f"ERROR: no packs under {root / 'templates/policy-packs'}", file=sys.stderr)
        return 2

    disposition = disposition_for_rows(rows)
    payload: dict[str, object] = {
        "schema": "archlucid.policy-pack-freshness.v2",
        "generatedUtc": datetime.now(timezone.utc).isoformat(),
        "disposition": disposition,
        "packCount": len(rows),
        "staleThresholdDays": STALE_DAYS,
        "warnThresholdDays": WARN_DAYS,
        "packs": rows,
    }

    text = json.dumps(payload, indent=2) + "\n"

    if args.json_out is not None:
        args.json_out.parent.mkdir(parents=True, exist_ok=True)
        args.json_out.write_text(text, encoding="utf-8")

    if args.markdown_out is not None:
        args.markdown_out.write_text(render_markdown(payload), encoding="utf-8")

    print(text)

    if disposition == "HOLD":
        return 1

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
