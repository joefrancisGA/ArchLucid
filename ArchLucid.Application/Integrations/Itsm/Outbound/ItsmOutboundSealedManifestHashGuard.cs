using ArchLucid.Application.Findings;
using ArchLucid.Application.Integrations.Itsm;
using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.Queries;

namespace ArchLucid.Application.Integrations.Itsm.Outbound;

/// <summary>Wave-24 suggestion 237: ITSM outbound ticket create fail-closed on sealed hash and inventory-bound finding.</summary>
public static class ItsmOutboundSealedManifestHashGuard
{
    public static async Task EnsureFindingRunReadyOrThrowAsync(
        FindingInspectResponse inspect,
        ScopeContext scope,
        IAuthorityQueryService authorityQueryService,
        IManifestHashService manifestHashService,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(inspect);
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentNullException.ThrowIfNull(authorityQueryService);
        ArgumentNullException.ThrowIfNull(manifestHashService);

        await ItsmInboundSealedManifestHashGuard.EnsureFindingRunSealedManifestHashOrThrowAsync(
            inspect.RunId,
            scope,
            authorityQueryService,
            manifestHashService,
            cancellationToken);

        await FindingInspectPinnedEvidenceGuard.EnsureInspectEvidenceInventoryBoundOrThrowAsync(
            inspect,
            scope,
            authorityQueryService,
            cancellationToken);
    }
}
