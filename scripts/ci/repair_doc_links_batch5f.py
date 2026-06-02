#!/usr/bin/env python3
"""Batch 5F (TB-170): repair common relative-link depth drift after docs consolidation."""

from __future__ import annotations

import re
import sys
from pathlib import Path

LINK_RE = re.compile(r"(?<!\!)\[[^\]]*\]\(([^()]*(?:\([^()]*\))*[^()]*)\)")


def repo_root() -> Path:
    return Path(__file__).resolve().parents[2]


def apply_replacements(text: str, replacements: list[tuple[str, str]]) -> tuple[str, int]:
    changed = 0
    result = text

    for old, new in replacements:
        if old not in result:
            continue

        count = result.count(old)
        result = result.replace(old, new)
        changed += count

    return result, changed


def adr_replacements() -> list[tuple[str, str]]:
    return [
        ("](../runbooks/", "](../../runbooks/"),
        ("](../archive/", "](../../archive/"),
        ("](../PENDING_QUESTIONS.md", "](../../PENDING_QUESTIONS.md"),
        ("](../CHANGELOG.md", "](../../CHANGELOG.md"),
        ("](../security/", "](../../security/"),
        ("](../evidence/", "](../../evidence/"),
        ("](../architecture/", "](../"),
        ("](../../integrations/", "](../../../integrations/"),
        ("](../../ArchLucid.", "](../../../ArchLucid."),
        (
            "0004-authority-commit-outbox.md",
            "0004-transactional-outbox-retrieval-indexing.md",
        ),
    ]


def demo_replacements() -> list[tuple[str, str]]:
    return [
        ("](operator-shell.md)", "](../library/operator-shell.md)"),
        ("](AUDIT_COVERAGE_MATRIX.md)", "](../library/AUDIT_COVERAGE_MATRIX.md)"),
        ("](V1_SCOPE.md)", "](../library/V1_SCOPE.md)"),
        ("](SECURITY.md)", "](../library/SECURITY.md)"),
        ("](RELEASE_SMOKE.md)", "](../library/RELEASE_SMOKE.md)"),
    ]


def go_to_market_replacements() -> list[tuple[str, str]]:
    return [
        ("](go-to-market/", "]("),
        ("](library/", "](../library/"),
        ("](runbooks/", "](../runbooks/"),
        ("](architecture/", "](../architecture/"),
        ("](START_HERE.md)", "](../START_HERE.md)"),
        ("](CORE_PILOT.md)", "](../CORE_PILOT.md)"),
        ("](../../integrations/", "](../../../integrations/"),
        ("](../AZURE_MARKETPLACE_SAAS_OFFER.md", "](AZURE_MARKETPLACE_SAAS_OFFER.md)"),
        ("](../../CORE_PILOT.md", "](../CORE_PILOT.md)"),
        ("](../../AZURE_MARKETPLACE_SAAS_OFFER.md", "](AZURE_MARKETPLACE_SAAS_OFFER.md)"),
        (
            "](../../security/pen-test-summaries/",
            "](../security/pen-test-summaries/",
        ),
        ("](TECH_BACKLOG.md)", "](../library/TECH_BACKLOG.md)"),
        ("](GUIDED_PILOT.md)", "](../runbooks/FIRST_PILOT_OPERATOR_PATH.md)"),
        ("](../scripts/", "](../../scripts/"),
        ("](../../archive/agent-prompts/", "](../archive/agent-prompts/"),
        ("](../library/CONCEPT_VOCABULARY.md", "](../../library/CONCEPT_VOCABULARY.md"),
    ]


def engineering_replacements() -> list[tuple[str, str]]:
    return [
        ("](START_HERE.md)", "](../START_HERE.md)"),
        ("](engineering/", "]("),
        ("](library/", "](../library/"),
        ("](ARCHITECTURE_ON_ONE_PAGE.md)", "](ARCHITECTURE_ON_ONE_PAGE.md)"),
        ("](TROUBLESHOOTING.md)", "](../TROUBLESHOOTING.md)"),
    ]


def contributor_reference_replacements() -> list[tuple[str, str]]:
    return [
        ("](../START_HERE.md", "](../../START_HERE.md"),
        ("](../security/", "](../../security/"),
        ("](../runbooks/", "](../../runbooks/"),
        ("](../go-to-market/", "](../../go-to-market/"),
        ("](../architecture/", "](../../architecture/"),
        ("](V1_SCOPE.md)", "](../V1_SCOPE.md)"),
        ("](API_FUZZ_TESTING.md)", "](../API_FUZZ_TESTING.md)"),
        ("](CONFIGURATION_REFERENCE.md)", "](../CONFIGURATION_REFERENCE.md)"),
        ("](AUDIT_RETENTION_POLICY.md)", "](../AUDIT_RETENTION_POLICY.md)"),
        ("](PRE_COMMIT_GOVERNANCE_GATE.md)", "](../PRE_COMMIT_GOVERNANCE_GATE.md)"),
    ]


def library_replacements() -> list[tuple[str, str]]:
    return [
        ("](../templates/", "](../../templates/"),
        ("](library/BILLING.md)", "](BILLING.md)"),
        ("](START_HERE.md)", "](../START_HERE.md)"),
        ("](../NAVIGATOR.md", "](../archive/NAVIGATOR.md"),
        ("](../OPERATIONS_ADMIN.md", "](OPERATIONS_ADMIN.md)"),
        ("](../contributor/README.md", "](../engineering/CONTRIBUTOR_ON_ONE_PAGE.md)"),
        ("](../customer-facing/", "](customer-facing/"),
        ("](../PILOT_GUIDE.md", "](customer-facing/PILOT_GUIDE.md)"),
        ("](../FIRST_30_MINUTES.md", "](../engineering/FIRST_30_MINUTES.md"),
        ("](../INSTALL_ORDER.md", "](../engineering/INSTALL_ORDER.md"),
        ("](../BREAKING_CHANGES.md", "](../archive/BREAKING_CHANGES.md"),
        ("](../NEXT_REFACTORINGS.md", "](../archive/NEXT_REFACTORINGS.md"),
        ("](BREAKING_CHANGES.md)", "](../archive/BREAKING_CHANGES.md"),
        ("](../../SECURITY.md", "](../SECURITY.md"),
        ("](../../INSTALL_ORDER.md", "](../engineering/INSTALL_ORDER.md"),
        ("](../../NAVIGATOR.md", "](../archive/NAVIGATOR.md"),
    ]


def deployment_replacements() -> list[tuple[str, str]]:
    return [
        ("](../INSTALL_ORDER.md", "](../engineering/INSTALL_ORDER.md"),
    ]


def go_to_market_archive_replacements() -> list[tuple[str, str]]:
    return [
        (
            "](../library/MARKETABILITY_ASSESSMENT_2026_04_15.md",
            "](../archive/MARKETABILITY_ASSESSMENT_2026_04_15_PRE_M2.md",
        ),
        (
            "](../library/MARKETABILITY_ASSESSMENT_2026_04_15_SAAS_ONLY.md",
            "](../archive/MARKETABILITY_ASSESSMENT_2026_04_15_SAAS_ONLY_PRE_TRUST_CENTER.md",
        ),
        (
            "](../library/DECISION_VELOCITY_SOLUTION_QUALITY_ASSESSMENT_2026_05_02_1.29.md",
            "](../assessments/LATEST_GPT55.md",
        ),
        ("](../FIRST_RUN_WIZARD.md", "](../library/FIRST_RUN_WIZARD.md"),
        ("](../security/SOC2_ROADMAP.md", "](../security/SOC2_SELF_ASSESSMENT_2026.md"),
    ]


def rules_for_file(path: Path) -> list[tuple[str, str]]:
    rel = path.as_posix()
    rules: list[tuple[str, str]] = []

    if rel.startswith("docs/architecture/adrs/"):
        rules.extend(adr_replacements())

    if rel.startswith("docs/demo/"):
        rules.extend(demo_replacements())

    if rel.startswith("docs/go-to-market/"):
        rules.extend(go_to_market_replacements())
        rules.extend(go_to_market_archive_replacements())

    if rel == "docs/engineering/CONTRIBUTOR_ON_ONE_PAGE.md":
        rules.extend(engineering_replacements())

    if rel.startswith("docs/library/contributor-reference/"):
        rules.extend(contributor_reference_replacements())

    if rel.startswith("docs/library/"):
        rules.extend(library_replacements())

    if rel.startswith("docs/deployment/"):
        rules.extend(deployment_replacements())

    if rel.startswith("docs/go-to-market/buyer-jobs/") or rel.startswith("docs/go-to-market/demo-proof-packets/"):
        rules.append(("](../CORE_PILOT.md", "](../../CORE_PILOT.md)"))

    if rel.startswith("docs/go-to-market/reference-customers/"):
        rules.extend([
            ("](../../../integrations/", "](../../../docs/integrations/"),
            ("](AZURE_MARKETPLACE_SAAS_OFFER.md)", "](../../AZURE_MARKETPLACE_SAAS_OFFER.md)"),
        ])

    if rel == "docs/go-to-market/UI_GLOSSARY_V1.md":
        rules.append(("](../../library/", "](../library/"))

    if rel == "docs/engineering/CONTRIBUTOR_ON_ONE_PAGE.md":
        rules.append(("](ARCHITECTURE_ON_ONE_PAGE.md)", "](../ARCHITECTURE_ON_ONE_PAGE.md)"))

    if rel.startswith("docs/architecture/adrs/"):
        rules.append((
            "ArchLucid.Application/Common/ActorContext.cs",
            "ArchLucid.Application/Common/ActorContextKeys.cs",
        ))

    if rel == "docs/library/ARCHITECTURE_INVARIANTS.md":
        rules.append(("](../archive/NEXT_REFACTORINGS.md", "](NEXT_REFACTORINGS.md)"))

    if rel == "docs/library/CUSTOM_AGENT_HANDLER_GUIDE.md":
        rules.append(("](../archive/BREAKING_CHANGES.md", "](../../BREAKING_CHANGES.md)"))

    if rel.startswith("docs/library/customer-facing/"):
        rules.extend([
            ("](../engineering/INSTALL_ORDER.md", "](../../engineering/INSTALL_ORDER.md"),
            ("](../archive/NAVIGATOR.md", "](../../archive/NAVIGATOR.md"),
        ])

    if rel == "docs/library/TECH_BACKLOG.md":
        rules.extend([
            ("](../scripts/", "](../../scripts/"),
            ("](../OPERATIONS_LLM_QUOTA.md", "](../operations/OPERATIONS_LLM_QUOTA.md"),
        ])

    if rel.startswith("docs/runbooks/"):
        rules.extend([
            ("](../AZURE_MARKETPLACE_SAAS_OFFER.md", "](../go-to-market/AZURE_MARKETPLACE_SAAS_OFFER.md"),
            ("](../RTO_RPO_TARGETS.md", "](../library/RTO_RPO_TARGETS.md"),
            ("](../library/API_KEY_ROTATION.md", "](API_KEY_ROTATION.md)"),
            ("](ORCHESTRATOR_RETRIES.md)", "](../library/ORCHESTRATOR_RETRIES.md)"),
        ])

    if rel.startswith("docs/onboarding/"):
        rules.append(("](../INSTALL_ORDER.md", "](../engineering/INSTALL_ORDER.md"))

    if rel == "docs/operations/PROJECTION_CACHE_AND_REPLICAS.md":
        rules.append(("](../KNOWLEDGE_GRAPH.md", "](../library/KNOWLEDGE_GRAPH.md"))

    if rel == "docs/library/START_HERE_DEPTH.md":
        rules.extend([
            ("](../SECURITY.md", "](SECURITY.md)"),
            ("](../FIRST_5_DOCS.md", "](../FIRST_5_DOCS.md)"),
            ("](../FIRST_FIVE_DOCS.md", "](../FIRST_FIVE_DOCS.md)"),
            ("](../FIRST_RUN_WIZARD.md", "](../FIRST_RUN_WIZARD.md)"),
            ("](../FIRST_RUN_WALKTHROUGH.md", "](../FIRST_RUN_WALKTHROUGH.md)"),
        ])

    if rel == "docs/library/contributor-reference/README.md":
        rules.append(("](customer-facing/README.md)", "](../customer-facing/README.md)"))

    if rel == "archlucid-ui/docs/KEYBOARD_SHORTCUTS.md":
        rules.append((
            "../../docs/library/ONBOARDING_HAPPY_PATH.md",
            "../../docs/onboarding/ONBOARDING_HAPPY_PATH.md",
        ))

    if rel == "archlucid-ui/docs/OPERATOR_SHELL_TUTORIAL.md":
        rules.append((
            "../../docs/FIRST_RUN_WIZARD.md",
            "../../docs/library/FIRST_RUN_WIZARD.md",
        ))

    if rel == "docs/library/EXECUTIVE_SHELL.md":
        rules.append((
            "archlucid-ui/src/app/(operator)/runs/[runId]/findings/[findingId]/FindingInspectFindingBody.tsx",
            "archlucid-ui/src/app/(operator)/reviews/[runId]/findings/[findingId]/FindingInspectFindingBody.tsx",
        ))

    return rules


def global_pass2_replacements() -> list[tuple[str, str]]:
    """Repo-wide drift fixes after docs/library consolidation (batch 5F pass 2)."""
    return [
        ("../../.cursor/rules/Architecture-Invariants.mdc", "ARCHITECTURE_INVARIANTS.md"),
        ("../../.cursor/rules/CSharp-Terse-Guards-And-Flow.mdc", "CSHARP_HOUSE_STYLE.md"),
        ("../../.cursor/rules/CSharp-Terse-Modern-Language.mdc", "CSHARP_HOUSE_STYLE.md"),
        ("../../.cursor/rules/CSharp-Members-And-Construction.mdc", "CSHARP_HOUSE_STYLE.md"),
        ("../../.cursor/rules/User-Task-Discipline.mdc", "../engineering/AGENTS.md"),
        ("../../.cursor/rules/CodeQL-Sanitized-Logging.mdc", "CODEQL_MERGE_AND_LOCAL.md"),
        ("../../.cursor/rules/Http-Surface-Docs-And-Clients.mdc", "../engineering/AGENTS.md"),
        ("../../.cursor/rules/Code-Coverage-Product-Only.mdc", "REPO_DIGEST.md"),
        ("../../.cursor/rules/Docs-Root-Markdown-Budget.mdc", "REPO_HYGIENE.md"),
        ("../../.cursor/rules/Navigation.mdc", "../CHANGELOG.md"),
        (
            "SqlRlsTenantIsolationApiFactory.cs",
            "GreenfieldSqlApiFactory.cs",
        ),
        (
            "RlsTenantScopePolicyParityIntegrationTests.cs",
            "TenantScopedTableDdlTests.cs",
        ),
        (
            "../../ArchLucid.Persistence.Tests/RlsTenantScopePolicyParityIntegrationTests.cs",
            "../../ArchLucid.Architecture.Tests/TenantScopedTableDdlTests.cs",
        ),
        (
            "../../ArchLucid.Persistence/BlobStore/ArtifactBlobTenantPaths.cs",
            "../../ArchLucid.Core/Persistence/ApplicationPorts/BlobStore/ArtifactBlobTenantPaths.cs",
        ),
        (
            "../../ArchLucid.Persistence.Coordination/Caching/HotPathCacheOptions.cs",
            "../../ArchLucid.Persistence/Coordination/Caching/HotPathCacheOptions.cs",
        ),
        (
            "../../ArchLucid.Api.Tests/Security/GreenfieldSqlApiFactory.cs",
            "../../ArchLucid.Api.Tests/GreenfieldSqlApiFactory.cs",
        ),
        (
            "../../ArchLucid.Persistence.Tests/TenantScopedTableDdlTests.cs",
            "../../ArchLucid.Architecture.Tests/TenantScopedTableDdlTests.cs",
        ),
        ("../../.vscode/extensions.json", "CODEQL_MERGE_AND_LOCAL.md"),
        ("../operations/OPERATIONS_LLM_QUOTA.md", "OPERATIONS_LLM_QUOTA.md"),
        ("../COVERAGE_GAP_ANALYSIS.md", "COVERAGE_GAP_ANALYSIS.md"),
        ("../infra/prometheus/archlucid-alerts.yml", "OBSERVABILITY.md"),
        ("../../infra/zap/README.md", "../security/ZAP_BASELINE_RULES.md"),
        (
            "../../dist/procurement-pack/procurement-pack-quality.md",
            "../../scripts/build_procurement_pack.py",
        ),
        (
            "../scripts/ci/data/tier_fit_validation_matrix.v1.json",
            "../../scripts/ci/data/tier_fit_validation_matrix.v1.json",
        ),
        ("NAV_CONFIG_CONTRACT.md", "../../archlucid-ui/docs/NAV_CONFIG_CONTRACT.md"),
        ("../FIRST_5_DOCS.md", "../archive/FIRST_5_DOCS.md"),
        ("../FIRST_FIVE_DOCS.md", "../archive/FIRST_5_DOCS.md"),
        ("../FIRST_RUN_WIZARD.md", "FIRST_RUN_WIZARD.md"),
        ("../FIRST_RUN_WALKTHROUGH.md", "FIRST_RUN_WALKTHROUGH.md"),
        ("../../AZURE_MARKETPLACE_SAAS_OFFER.md", "../AZURE_MARKETPLACE_SAAS_OFFER.md"),
        ("CORRELATION_AND_TRACING.md", "../library/BACKGROUND_JOB_CORRELATION.md"),
        ("TENANT_SQL_TOPOLOGY_RUNBOOK.md", "../operations/TENANT_SQL_TOPOLOGY_RUNBOOK.md"),
        ("../library/CHAMPION_48H_KIT.md", "../go-to-market/DECISION_FAST_LANE.md"),
        (
            "archlucid-ui/src/app/(operator)/runs/new/page.tsx",
            "archlucid-ui/src/app/(operator)/reviews/new/page.tsx",
        ),
        (
            "archlucid-ui/src/app/(operator)/runs/[runId]/page.tsx",
            "archlucid-ui/src/app/(operator)/reviews/[runId]/page.tsx",
        ),
    ]


def pass2_rules_for_file(path: Path) -> list[tuple[str, str]]:
    rel = path.as_posix()
    rules: list[tuple[str, str]] = []

    if rel.startswith("docs/library/"):
        rules.append(("../SECURITY.md", "SECURITY.md"))

    if rel.startswith("docs/library/") and rel.count("/") == 2:
        rules.append(("../../security/", "../security/"))

    if rel.startswith("docs/library/contributor-reference/") or rel.startswith("docs/library/customer-facing/"):
        rules.append(("](../security/", "](../../security/"))

    if rel.startswith("docs/library/customer-facing/"):
        rules.append(("](SECURITY.md)", "](../SECURITY.md)"))

    if rel.startswith("docs/go-to-market/"):
        rules.extend([
            ("../SECURITY.md", "../library/SECURITY.md"),
            ("../../security/", "../security/"),
        ])

    if rel.startswith("docs/security/"):
        rules.append(("../SECURITY.md", "../library/SECURITY.md"))

    if rel == "docs/PENDING_QUESTIONS.md":
        rules.append(("](SECURITY.md)", "](../library/SECURITY.md)"))

    if rel == "docs/security/ZAP_BASELINE_RULES.md":
        rules.append((
            "[infra/zap/README.md](../../security/ZAP_BASELINE_RULES.md)",
            "`infra/zap/baseline-pr.tsv` (see table below)",
        ))

    if rel == "docs/security/TENANT_ISOLATION_IMPLEMENTATION_NOTES.md":
        rules.append((
            "../../ArchLucid.Architecture.Tests/TenantScopedTableDdlTests.cs",
            "../../ArchLucid.Architecture.Tests/TenantScopedTableDdlTests.cs",
        ))

    if rel == "docs/library/POLICY_PACK_ARC_AMPE_DESIGN.md":
        rules.append((
            "POLICY_PACK_APPENDIX_ARC_AMPE_V1.md",
            "POLICY_PACK_APPENDIX_ARC_AMPE_V1.md",
        ))

    return rules


def repair_file(path: Path) -> int:
    rel = path.relative_to(repo_root())
    rules = rules_for_file(rel)
    rules.extend(global_pass2_replacements())
    rules.extend(pass2_rules_for_file(rel))

    if not rules:
        return 0

    original = path.read_text(encoding="utf-8")
    updated, changed = apply_replacements(original, rules)

    if changed <= 0:
        return 0

    path.write_text(updated, encoding="utf-8", newline="\n")
    return changed


def main() -> int:
    root = repo_root()
    total = 0
    touched: list[str] = []

    for path in sorted(list(root.glob("docs/**/*.md")) + list(root.glob("archlucid-ui/docs/**/*.md"))):
        if "docs/archive/" in path.as_posix():
            continue

        changed = repair_file(path)

        if changed > 0:
            total += changed
            touched.append(f"{path.relative_to(root)} ({changed})")

    print(f"repair_doc_links_batch5f: {total} link target(s) rewritten in {len(touched)} file(s)")

    for line in touched[:40]:
        print(f"  - {line}")

    if len(touched) > 40:
        print(f"  ... and {len(touched) - 40} more")

    return 0


if __name__ == "__main__":
    sys.exit(main())
