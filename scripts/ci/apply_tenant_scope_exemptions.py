#!/usr/bin/env python3
"""Apply [TenantScopeExempt] to operational persistence types for ARCH006 remediation."""

from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]

USING = "using ArchLucid.Core.Tenancy;\n"

EXEMPTIONS: dict[str, tuple[str, str]] = {
    r"ArchLucid.Persistence\Analytics\InternalCrossTenantSqlMetricsQueries.cs": (
        "Operational",
        "Platform-operator cross-tenant analytics; explicit RBAC at caller; not a tenant-session repository path.",
    ),
    r"ArchLucid.Persistence\Coordination\Backfill\SqlRelationalBackfillPagedEntityLoader.cs": (
        "Operational",
        "Relational backfill worker pages entities within a tenant catalog using dedicated job identity.",
    ),
    r"ArchLucid.Persistence\Coordination\Backfill\SqlRelationalBackfillService.cs": (
        "Operational",
        "Relational backfill orchestration runs under dedicated job identity within tenant catalogs.",
    ),
    r"ArchLucid.Persistence\Coordination\Diagnostics\DapperOutboxOperationalMetricsReader.cs": (
        "Operational",
        "Operational outbox depth metrics aggregate within tenant catalog for monitoring dashboards.",
    ),
    r"ArchLucid.Persistence\Coordination\Export\DapperRunExportBlobPushOutboxRepository.cs": (
        "Operational",
        "Outbox worker dequeues by outbox id within tenant catalog; enqueue carries scope triple on row.",
    ),
    r"ArchLucid.Persistence\Coordination\Projection\DapperPostCommitProjectionOutboxRepository.cs": (
        "Operational",
        "Outbox worker dequeues by outbox id within tenant catalog; enqueue carries scope triple on row.",
    ),
    r"ArchLucid.Persistence\Coordination\Retrieval\DapperRetrievalIndexingOutboxRepository.cs": (
        "Operational",
        "Outbox worker dequeues by outbox id within tenant catalog; enqueue carries scope triple on row.",
    ),
    r"ArchLucid.Persistence\Cosmos\DapperCosmosGraphSnapshotOutboxRepository.cs": (
        "Operational",
        "Outbox worker dequeues by outbox id within tenant catalog; enqueue carries scope triple on row.",
    ),
    r"ArchLucid.Persistence\IntegrationOutbox\DapperIntegrationEventOutboxRepository.cs": (
        "Operational",
        "Outbox worker dequeues by outbox id within tenant catalog; enqueue carries scope triple on row.",
    ),
    r"ArchLucid.Persistence\Orchestration\DapperAuthorityPipelineWorkRepository.cs": (
        "Operational",
        "Authority pipeline outbox worker dequeues by work id within tenant catalog.",
    ),
    r"ArchLucid.Persistence\CustomerSuccess\SqlAdminTenantHealthReader.cs": (
        "Operational",
        "Operator health snapshot reader aggregates per-tenant catalog metrics for platform dashboards.",
    ),
    r"ArchLucid.Persistence\Tenancy\Diagnostics\DapperTrialFunnelOperationalMetricsReader.cs": (
        "Operational",
        "Trial funnel operational metrics aggregate within tenant catalog for monitoring.",
    ),
    r"ArchLucid.Persistence\Tenancy\SqlTenantHardPurgeService.cs": (
        "Operational",
        "Tenant hard purge uses platform lifecycle identity and dynamic delete SQL within the target catalog.",
    ),
    r"ArchLucid.Persistence\Search\SqlGlobalSearchRepository.cs": (
        "Operational",
        "Global search composes scoped SQL fragments at runtime; callers pass ScopeContext into builder methods.",
    ),
    r"ArchLucid.Persistence\Tenancy\DapperTenantRepository.cs": (
        "SystemPlaneOnly",
        "Tenant registry and lifecycle SQL against system-plane tables and cross-catalog provisioning commands.",
    ),
}


def apply_exemption(relative_path: str, reason: str, justification: str) -> None:
    path = ROOT / relative_path.replace("\\", "/")
    text = path.read_text(encoding="utf-8")

    if "TenantScopeExempt" in text:
        print(f"skip (already exempt): {relative_path}")
        return

    if USING.strip() not in text.split("namespace")[0]:
        header = text.split("namespace")[0]
        first_using = header.find("using ")
        if first_using >= 0:
            end = header.find("\n", first_using)
            text = text[: end + 1] + USING + text[end + 1 :]
        else:
            text = USING + text

    marker = "[TenantScopeExempt("
    attribute = (
        f'[TenantScopeExempt(TenantScopeExemptReason.{reason}, "{justification}")]\n'
    )

    for needle in ("public sealed class", "internal static class", "public static class"):
        if needle in text:
            text = text.replace(needle, attribute + needle, 1)
            break
    else:
        raise RuntimeError(f"Could not locate type declaration in {relative_path}")

    path.write_text(text, encoding="utf-8")
    print(f"updated: {relative_path}")


def main() -> None:
    for relative_path, (reason, justification) in EXEMPTIONS.items():
        apply_exemption(relative_path, reason, justification)


if __name__ == "__main__":
    main()
