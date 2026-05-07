"""Regenerate the appendix blob for docs/library/ROUTE_TIER_POLICY_NAV_MATRIX.md from the JSON registry.

Run from repo root after:

  python scripts/ci/assert_route_tier_policy_nav.py --materialize-registry

Then replace the "## Appendix — per-controller registry" section in the matrix with this file output.
"""

import json
from pathlib import Path

root = Path(__file__).resolve().parents[2]
r = json.loads((root / "scripts/ci/data/route_tier_policy_nav_registry.json").read_text(encoding="utf-8"))
n = len(r["entries"])
lines = [
    "",
    "## Appendix — per-controller registry (CI)",
    "",
    "Merge-blocking check: `python scripts/ci/assert_route_tier_policy_nav.py` after editing controllers, overrides, or this table.",
    "",
    "- **Registry JSON:** `scripts/ci/data/route_tier_policy_nav_registry.json` (regenerate: `python scripts/ci/assert_route_tier_policy_nav.py --materialize-registry`).",
    "- **Allowlist / exemption reasons:** `scripts/ci/data/route_tier_policy_nav_exemptions.json`.",
    "- **Nav / exemption overrides:** `scripts/ci/data/route_tier_policy_nav_overrides.json`.",
    "",
    f"<!-- route-tier-policy-nav-registry-count:{n} -->",
    "",
    "| Controller source | API prefix (normalized) | commercial_tier (class) | class_policy | Operator nav href (parity only) | Exemption code |",
    "| --- | --- | --- | --- | --- | --- |",
]
for e in sorted(r["entries"], key=lambda x: x["controller_file"]):
    cf, np = e["controller_file"], e["normalized_prefix"]
    ex = e.get("exemption") or ""
    nav = e.get("nav_operator_href") or ""
    tier, pol = e["commercial_tier"], e["class_policy"]
    lines.append(f"| `{cf}` | `{np}` | {tier} | {pol} | {nav} | {ex} |")

out = root / "_route_matrix_appendix.md"
out.write_text("\n".join(lines) + "\n", encoding="utf-8")
print(out)
