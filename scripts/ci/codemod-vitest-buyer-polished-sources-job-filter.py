#!/usr/bin/env python3
"""Wrap buyer-polished Sources loops with filterOrientationSourcesForJobContext when missing."""

from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2] / "archlucid-ui" / "src"

PATH_BY_SOURCES: dict[str, str] = {
    "FIRST_REVIEW_GUIDE_SOURCES": "FIRST_REVIEW_GUIDE_PATH",
    "SLACK_INTEGRATION_SOURCES": "SLACK_INTEGRATION_CANONICAL_PATH",
    "AUTH_DOMAINS_SETTINGS_SOURCES": "AUTH_DOMAINS_SETTINGS_CANONICAL_PATH",
    "CLOUD_CONNECTIONS_SOURCES": "CLOUD_CONNECTIONS_CANONICAL_PATH",
    "ACCOUNT_SECURITY_SETTINGS_SOURCES": "ACCOUNT_SECURITY_SETTINGS_CANONICAL_PATH",
    "DIGESTS_SUBSCRIPTIONS_ORIENTATION_SOURCES": "DIGESTS_SUBSCRIPTIONS_TAB_PATH",
    "INVITE_REVIEWER_SOURCES": "INVITE_REVIEWER_CANONICAL_PATH",
    "SETTINGS_ROLES_SETTINGS_SOURCES": "SETTINGS_ROLES_SETTINGS_CANONICAL_PATH",
    "TENANT_SETTINGS_SOURCES": "TENANT_SETTINGS_CANONICAL_PATH",
    "ARCHITECTURES_LIST_SOURCES": "ARCHITECTURES_LIST_CANONICAL_PATH",
    "MODEL_GOVERNANCE_SETTINGS_SOURCES": "MODEL_GOVERNANCE_SETTINGS_CANONICAL_PATH",
    "SCIM_PROVISIONING_SOURCES": "SCIM_PROVISIONING_CANONICAL_PATH",
    "SYSTEM_HEALTH_SOURCES": "SYSTEM_HEALTH_CANONICAL_PATH",
    "OPERATOR_HOME_ORIENTATION_SOURCES": "OPERATOR_HOME_CANONICAL_PATH",
    "REVIEWS_NEW_ORIENTATION_SOURCES": "REVIEWS_NEW_CANONICAL_PATH",
    "FAQ_SOURCES": "FAQ_CANONICAL_PATH",
    "GET_STARTED_ORIENTATION_SOURCES": "GET_STARTED_CANONICAL_PATH",
    "DIGEST_SPONSOR_SOURCES": "DIGEST_SPONSOR_CANONICAL_PATH",
    "ADVISORY_SCHEDULES_ORIENTATION_SOURCES": "ADVISORY_SCANS_SCHEDULES_HREF",
}

PATH_IMPORTS: dict[str, str] = {
    "FIRST_REVIEW_GUIDE_PATH": 'import { FIRST_REVIEW_GUIDE_PATH } from "@/lib/first-review-guide-route";\n',
    "SLACK_INTEGRATION_CANONICAL_PATH": "",
    "AUTH_DOMAINS_SETTINGS_CANONICAL_PATH": 'import { AUTH_DOMAINS_SETTINGS_CANONICAL_PATH } from "@/lib/auth-domains-settings-evidence-copy";\n',
    "CLOUD_CONNECTIONS_CANONICAL_PATH": 'import { CLOUD_CONNECTIONS_CANONICAL_PATH } from "@/lib/cloud-connections-evidence-copy";\n',
    "ACCOUNT_SECURITY_SETTINGS_CANONICAL_PATH": 'import { ACCOUNT_SECURITY_SETTINGS_CANONICAL_PATH } from "@/lib/account-security-settings-evidence-copy";\n',
    "DIGESTS_SUBSCRIPTIONS_TAB_PATH": 'import { DIGESTS_SUBSCRIPTIONS_TAB_PATH } from "@/lib/digests-route-paths";\n',
    "INVITE_REVIEWER_CANONICAL_PATH": 'import { INVITE_REVIEWER_CANONICAL_PATH } from "@/lib/invite-reviewer-evidence-copy";\n',
    "SETTINGS_ROLES_SETTINGS_CANONICAL_PATH": 'import { SETTINGS_ROLES_SETTINGS_CANONICAL_PATH } from "@/lib/settings-roles-settings-evidence-copy";\n',
    "TENANT_SETTINGS_CANONICAL_PATH": 'import { TENANT_SETTINGS_CANONICAL_PATH } from "@/lib/tenant-settings-evidence-copy";\n',
    "ARCHITECTURES_LIST_CANONICAL_PATH": 'import { ARCHITECTURES_LIST_CANONICAL_PATH } from "@/lib/architectures-list-evidence-copy";\n',
    "MODEL_GOVERNANCE_SETTINGS_CANONICAL_PATH": 'import { MODEL_GOVERNANCE_SETTINGS_CANONICAL_PATH } from "@/lib/model-governance-settings-evidence-copy";\n',
    "SCIM_PROVISIONING_CANONICAL_PATH": 'import { SCIM_PROVISIONING_CANONICAL_PATH } from "@/lib/scim-provisioning-evidence-copy";\n',
    "SYSTEM_HEALTH_CANONICAL_PATH": 'import { SYSTEM_HEALTH_CANONICAL_PATH } from "@/lib/system-health-evidence-copy";\n',
    "OPERATOR_HOME_CANONICAL_PATH": 'import { OPERATOR_HOME_CANONICAL_PATH } from "@/lib/operator/operator-home-evidence-copy";\n',
    "REVIEWS_NEW_CANONICAL_PATH": 'import { REVIEWS_NEW_CANONICAL_PATH } from "@/lib/reviews-new-evidence-copy";\n',
    "FAQ_CANONICAL_PATH": 'import { FAQ_CANONICAL_PATH } from "@/lib/faq-evidence-copy";\n',
    "GET_STARTED_CANONICAL_PATH": 'import { GET_STARTED_CANONICAL_PATH } from "@/lib/get-started-evidence-copy";\n',
    "DIGEST_SPONSOR_CANONICAL_PATH": 'import { DIGEST_SPONSOR_CANONICAL_PATH } from "@/lib/marketing/digest-sponsor-evidence-copy";\n',
    "ADVISORY_SCANS_SCHEDULES_HREF": 'import { ADVISORY_SCANS_SCHEDULES_HREF } from "@/lib/advisory-scans-route";\n',
    "SECURITY_TRUST_CANONICAL_PATH": 'import { SECURITY_TRUST_CANONICAL_PATH } from "@/lib/security-trust-evidence-copy";\n',
}

IMPORT_FILTER = (
    'import { filterOrientationSourcesForJobContext } from "@/lib/evidence-orientation/job-context-orientation-sources-filter";\n'
)

LOOP_PATTERN = re.compile(
    r"for \(const source of filterWhereToGoNextFollowUpLinks\(([^)]+)\)",
    re.MULTILINE,
)

PATHNAME_MOCK_RE = re.compile(r'usePathname:\s*\(\)\s*=>\s*"([^"]+)"')


def pathname_from_mock(text: str) -> str | None:
    match = PATHNAME_MOCK_RE.search(text)
    if match is None:
        return None
    return f'"{match.group(1)}"'


def resolve_path_arg(text: str, sources_expr: str) -> str | None:
    sources_var = sources_expr.strip()
    if sources_var in PATH_BY_SOURCES:
        return PATH_BY_SOURCES[sources_var]
    if sources_var.startswith("securityTrustEvidenceSources"):
        return "SECURITY_TRUST_CANONICAL_PATH"
    if sources_var.startswith("buildProvenanceSources"):
        return pathname_from_mock(text)
    from_mock = pathname_from_mock(text)
    if from_mock is not None:
        return from_mock
    return None


def ensure_filter_import(text: str) -> str:
    if IMPORT_FILTER.strip() in text:
        return text
    anchor = 'import { filterWhereToGoNextFollowUpLinks }'
    idx = text.find(anchor)
    if idx < 0:
        return text
    return text[:idx] + IMPORT_FILTER + text[idx:]


def ensure_path_constant_import(text: str, path_const: str) -> str:
    if path_const.startswith('"'):
        return text
    import_line = PATH_IMPORTS.get(path_const, "")
    if not import_line or import_line.strip() in text:
        return text
    if f"import {{ {path_const} }}" in text or f", {path_const}" in text:
        return text
    anchor = 'import { filterWhereToGoNextFollowUpLinks }'
    idx = text.find(anchor)
    if idx < 0:
        anchor = 'import { filterOrientationSourcesForJobContext }'
        idx = text.find(anchor)
    if idx < 0:
        return text
    return text[:idx] + import_line + text[idx:]


def patch_slack_import(text: str) -> str:
    if "SLACK_INTEGRATION_CANONICAL_PATH" in text:
        return text
    return text.replace(
        "SLACK_INTEGRATION_SOURCES,\n} from \"@/lib/slack-integration-evidence-copy\";",
        "SLACK_INTEGRATION_SOURCES,\n  SLACK_INTEGRATION_CANONICAL_PATH,\n} from \"@/lib/slack-integration-evidence-copy\";",
    )


def wrap_loop(text: str, sources_expr: str, path_arg: str) -> str:
    old = f"for (const source of filterWhereToGoNextFollowUpLinks({sources_expr})"
    if "expectedSources = filterOrientationSourcesForJobContext" in text and old not in text:
        return text
    if old not in text:
        return text
    text = ensure_path_constant_import(text, path_arg)
    if path_arg == "SLACK_INTEGRATION_CANONICAL_PATH":
        text = patch_slack_import(text)
    new = f"""const expectedSources = filterOrientationSourcesForJobContext(
      filterWhereToGoNextFollowUpLinks({sources_expr}),
      {path_arg},
    );

    for (const source of expectedSources)"""
    return text.replace(old, new, 1)


def patch_file(path: Path, text: str) -> str | None:
    updated = text
    changed = False
    for match in LOOP_PATTERN.finditer(text):
        sources_expr = match.group(1)
        path_arg = resolve_path_arg(text, sources_expr)
        if path_arg is None:
            continue
        next_text = ensure_filter_import(updated)
        next_text = wrap_loop(next_text, sources_expr, path_arg)
        if next_text != updated:
            updated = next_text
            changed = True
            text = updated
    if not changed:
        return None
    return updated


def main() -> int:
    changed = 0
    for path in sorted(ROOT.rglob("*buyer-polished*.test.tsx")):
        text = path.read_text(encoding="utf-8")
        updated = patch_file(path, text)
        if updated is None:
            continue
        path.write_text(updated, encoding="utf-8")
        changed += 1
        print(path.relative_to(ROOT.parent))
    print(f"Patched {changed} files")
    return 0


if __name__ == "__main__":
    sys.exit(main())
