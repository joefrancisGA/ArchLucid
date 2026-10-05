using System.Text.Json;

using ArchLucid.Core.Audit;
using ArchLucid.Core.Manifest;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Models;
using ArchLucid.Persistence.Audit;
using ArchLucid.Persistence.Queries;
using ArchLucid.Persistence.Serialization;

namespace ArchLucid.Application.Bootstrap.Seeders;

/// <summary>
///     Demo-seeded committed runs skip the authority pipeline, so they may lack a
///     <see cref="AuditEventTypes.ManifestGenerated" /> anchor required by export lineage gates (TB-307 / ADR 0040).
/// </summary>
internal static class DemoSeedExportLineageAuditRepair
{
    private const string DemoRuleSetId = "archlucid.authority.demo-seed";

    internal static async Task TryEnsureManifestGeneratedExportLineageAnchorAsync(
        DemoSeedSeederDependencies deps,
        ScopeContext scope,
        Guid runId,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(deps);
        ArgumentNullException.ThrowIfNull(scope);

        RunDetailDto? runDetail =
            await deps.AuthorityQueryService.GetRunDetailForManifestCompareAsync(scope, runId, cancellationToken);

        ManifestDocument? golden = runDetail?.GoldenManifest;

        if (golden is null)
            return;

        string recomputedHash = deps.ManifestHashService.ComputeHash(golden);
        string? sealedHash = string.IsNullOrWhiteSpace(golden.ManifestHash) ? null : golden.ManifestHash;

        if (sealedHash is null || !string.Equals(recomputedHash, sealedHash, StringComparison.OrdinalIgnoreCase))
            return;

        if (await HasMatchingManifestGeneratedAnchorAsync(deps, scope, runId, recomputedHash, cancellationToken))
            return;

        string ruleSetId = string.IsNullOrWhiteSpace(golden.RuleSetId) ? DemoRuleSetId : golden.RuleSetId;

        await deps.AuditService.LogAsync(
            new AuditEvent
            {
                EventType = AuditEventTypes.ManifestGenerated,
                RunId = runId,
                ManifestId = golden.ManifestId,
                DataJson = JsonSerializer.Serialize(
                    new { ManifestHash = recomputedHash, RuleSetId = ruleSetId },
                    AuditJsonSerializationOptions.Instance),
            },
            cancellationToken);
    }

    private static async Task<bool> HasMatchingManifestGeneratedAnchorAsync(
        DemoSeedSeederDependencies deps,
        ScopeContext scope,
        Guid runId,
        string recomputedHash,
        CancellationToken cancellationToken)
    {
        AuditEventFilter filter = new()
        {
            RunId = runId,
            EventType = AuditEventTypes.ManifestGenerated,
            Take = 50,
        };

        IReadOnlyList<AuditEvent> rows = await deps.AuditRepository.GetFilteredAsync(
            scope.TenantId,
            scope.WorkspaceId,
            scope.ProjectId,
            filter,
            cancellationToken);

        foreach (AuditEvent row in rows.OrderByDescending(e => e.OccurredUtc).ThenByDescending(e => e.EventId))
        {
            if (string.IsNullOrWhiteSpace(row.DataJson))
                continue;

            ManifestGeneratedAuditPayload? payload = JsonSerializer.Deserialize<ManifestGeneratedAuditPayload>(
                row.DataJson,
                AuditJsonSerializationOptions.Instance);

            if (payload is null || string.IsNullOrWhiteSpace(payload.ManifestHash))
                continue;

            return string.Equals(payload.ManifestHash, recomputedHash, StringComparison.OrdinalIgnoreCase);
        }

        return false;
    }

    private sealed record ManifestGeneratedAuditPayload(string ManifestHash, string RuleSetId);
}
