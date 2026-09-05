using ArchLucid.Application.Integrations.Itsm.Outbound;
using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.Queries;

namespace ArchLucid.Application.Integrations.AzureBoards.Outbound;

/// <summary>Wave-25 suggestion 241: Azure Boards work-item create/copy fail-closed on sealed hash and inventory-bound finding.</summary>
public static class AzureBoardsOutboundSealedManifestHashGuard
{
    public static Task EnsureFindingRunReadyOrThrowAsync(
        FindingInspectResponse inspect,
        ScopeContext scope,
        IAuthorityQueryService authorityQueryService,
        IManifestHashService manifestHashService,
        CancellationToken cancellationToken) =>
        ItsmOutboundSealedManifestHashGuard.EnsureFindingRunReadyOrThrowAsync(
            inspect,
            scope,
            authorityQueryService,
            manifestHashService,
            cancellationToken);
}
