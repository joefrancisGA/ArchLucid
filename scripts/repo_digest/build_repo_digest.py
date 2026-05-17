#!/usr/bin/env python3
"""Regenerate docs/library/REPO_DIGEST.md with an inventory and doc anchors.

Excludes **historical** inventories: this script does **not** walk `docs/archive/`
or index archived markdown; `REPO_DIGEST.md` describes the live engineering spine only.
"""

from __future__ import annotations

import datetime as dt
from pathlib import Path


def repo_root() -> Path:
    return Path(__file__).resolve().parents[2]


def iter_archlucid_csprojs(root: Path) -> list[Path]:
    found: list[Path] = []

    for csproj in sorted(root.glob("ArchLucid.*/*.csproj")):
        if csproj.is_file():
            found.append(csproj)

    return found


def relative_posix(path: Path, root: Path) -> str:
    return path.relative_to(root).as_posix()


def main() -> int:
    root = repo_root()
    out = root / "docs" / "library" / "REPO_DIGEST.md"
    projects = iter_archlucid_csprojs(root)
    now = dt.datetime.now(dt.timezone.utc).strftime("%Y-%m-%d %H:%M UTC")

    lines: list[str] = [
        "> **Scope:** Generated skim for coding agents and contributors; "
        "not a buyer document. Regenerate after large project-tree changes. "
        "Does not replace **`V1_SCOPE.md`** or **`V1_DEFERRED.md`**.",
        "",
        f"**Generated:** {now} (`python scripts/repo_digest/build_repo_digest.py`)",
        "",
        "## Root .NET projects",
        "",
        "Product and test projects under **`ArchLucid.*/`** "
        "(paths relative to repo root; excludes **`tools/`**, **`templates/`**, etc.).",
        "",
        "| Project folder | `.csproj` |",
        "|----------------|-----------|",
    ]

    for csproj in projects:
        rel_dir = relative_posix(csproj.parent, root)
        rel_proj = relative_posix(csproj, root)
        lines.append(f"| `{rel_dir}/` | `{rel_proj}` |")

    lines.extend(
        [
            "",
            "## Canonical terminology",
            "",
            "- [`GLOSSARY.md`](GLOSSARY.md) — domain terms (review package, signed manifest, audit trail, …).",
            "",
            "## Architecture invariants (**INV-***)",
            "",
            "- **Catalog:** [`ARCHITECTURE_INVARIANTS.md`](ARCHITECTURE_INVARIANTS.md) "
            "(**`INV-001`** … **`INV-015`**).",
            "- **Rule pointer:** [`.cursor/rules/Architecture-Invariants.mdc`]"
            "(../../.cursor/rules/Architecture-Invariants.mdc).",
            "- **ADR:** [`0035-architecture-invariant-catalog.md`]"
            "(../architecture/adrs/0035-architecture-invariant-catalog.md).",
            "",
            "## V1 headline / deferrals (read sources; do not treat this digest as canonical)",
            "",
            "- [`V1_SCOPE.md`](V1_SCOPE.md) — in-contract V1 / V1.1 engineering.",
            "- [`V1_DEFERRED.md`](V1_DEFERRED.md) — deferrals and non-gates for assessments.",
            "- [`../go-to-market/TRUST_CENTER.md`](../go-to-market/TRUST_CENTER.md).",
            "",
            "## Weighted readiness assessments (canonical vs archive)",
            "",
            "- **Evidence contract:** [`ASSESSMENT_INPUTS.md`](ASSESSMENT_INPUTS.md) — ordered reads "
            "before broad scans; **`@Assessment-Scope-V1_1`** for **`(A)` / `(B)`** rules.",
            "- **Current score + backlog:** [`../assessments/LATEST.md`](../assessments/LATEST.md) only — "
            "**one** standing weighted pass.",
            "- **History:** [`../archive/assessments/`](../archive/assessments/) and archived quality narratives "
            "— **not** for quoting today's headline readiness (see **\"One workflow\"** in **`ASSESSMENT_INPUTS.md`**).",
            "",
            "## HTTP / OpenAPI (refresh when changing wire shape)",
            "",
            "- **Canonical contract:** **`GET /openapi/v1.json`** "
            "([`API_CONTRACTS.md`](API_CONTRACTS.md)).",
            "- **Snapshot:** `ArchLucid.Api.Tests/Contracts/openapi-v1.contract.snapshot.json`.",
            "- **Follow-through:** [`.cursor/rules/Http-Surface-Docs-And-Clients.mdc`]"
            "(../../.cursor/rules/Http-Surface-Docs-And-Clients.mdc).",
            "",
            "## Coverage & tests (anchors)",
            "",
            "- `coverage.runsettings` at repo root.",
            "- [`BUILD.md`](../engineering/BUILD.md), "
            "[`TEST_EXECUTION_MODEL.md`](TEST_EXECUTION_MODEL.md).",
            "- Coverage product-only rules: [`.cursor/rules/Code-Coverage-Product-Only.mdc`]"
            "(../../.cursor/rules/Code-Coverage-Product-Only.mdc).",
            "",
            "## Solution filters (**`*.slnf`**) at repo root",
            "",
            "- `ArchLucid.Core.slnf`, `ArchLucid.Backend.slnf`, `ArchLucid.UI.slnf` — "
            "see **[`engineering/AGENTS.md`](../engineering/AGENTS.md)** on `*.slnf` behavior vs **"
            "`dotnet build` closures**.",
            "",
            "## Next.js UI",
            "",
            "- **[`archlucid-ui/`](../../archlucid-ui/)** — [`archlucid-ui/AGENTS.md`](../../archlucid-ui/AGENTS.md).",
            "",
        ]
    )

    out.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"wrote {relative_posix(out, root)} ({len(projects)} projects)")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
