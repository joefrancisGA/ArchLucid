using ArchLucid.Application.Runs.Finalization;
using ArchLucid.Core.Manifest;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.Queries;

namespace ArchLucid.Application.Governance;

/// <summary>Wave-22 suggestion 218: governance disposition fail-closed without run-scoped sealed <see cref="ManifestDocument.ManifestHash"/>.</summary>
public static class GovernanceDispositionSealedManifestGuard
{
    public static async Task EnsureRunSealedManifestHashOrThrowAsync(
        Guid runId,
        ScopeContext scope,
        IAuthorityQueryService authorityQueryService,
        IManifestHashService manifestHashService,
        CancellationToken cancellationToken)
    {
        if (runId == Guid.Empty)
            return;

        ArgumentNullException.ThrowIfNull(scope);
        ArgumentNullException.ThrowIfNull(authorityQueryService);
        ArgumentNullException.ThrowIfNull(manifestHashService);

        RunDetailDto? detail =
            await authorityQueryService.GetRunDetailForManifestCompareAsync(scope, runId, cancellationToken);

        if (detail?.GoldenManifest is null)
        {
            throw new ConflictException(
                $"Governance disposition blocked for run '{runId:D}': committed golden manifest is missing.");
        }

        ManifestDecisionReceiptExportBinder.EnsureSealedManifestHashMatchesOrThrow(
            detail.GoldenManifest,
            runId.ToString("D"),
            manifestHashService);
    }
}
