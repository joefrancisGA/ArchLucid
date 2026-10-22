using ArchLucid.Application.Governance;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.Queries;

namespace ArchLucid.Application.Integrations.Itsm;

/// <summary>Wave-23 suggestion 224: ITSM inbound status apply fail-closed unless correlated run sealed <see cref="ManifestDocument.ManifestHash"/> verifies.</summary>
public static class ItsmInboundSealedManifestHashGuard
{
    public static async Task EnsureFindingRunSealedManifestHashOrThrowAsync(
        Guid runId,
        ScopeContext scope,
        IAuthorityQueryService authorityQueryService,
        IManifestHashService manifestHashService,
        CancellationToken cancellationToken)
    {
        if (runId == Guid.Empty)
        {
            throw new ConflictException("ITSM inbound sync blocked: correlated run id is missing.");
        }

        ArgumentNullException.ThrowIfNull(scope);
        ArgumentNullException.ThrowIfNull(authorityQueryService);
        ArgumentNullException.ThrowIfNull(manifestHashService);

        RunDetailDto? detail =
            await authorityQueryService.GetRunDetailForManifestCompareAsync(scope, runId, cancellationToken);

        PolicyPackSimulateSealedManifestGuard.EnsureRunSealedManifestHashOrThrow(
            detail?.GoldenManifest,
            runId.ToString("D"),
            manifestHashService);
    }
}
