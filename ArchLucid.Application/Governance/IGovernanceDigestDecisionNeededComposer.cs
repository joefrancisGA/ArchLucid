using ArchLucid.Contracts.Governance;
using ArchLucid.Core.Manifest;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Queries;

namespace ArchLucid.Application.Governance;

/// <summary>Builds TB-061 decision-needed digest sections from live governance data.</summary>
public interface IGovernanceDigestDecisionNeededComposer
{
    Task<string?> BuildDecisionNeededMarkdownAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid? projectId,
        CancellationToken cancellationToken = default);

    Task<GovernanceDecisionsNeededSummaryResponse> BuildSummaryAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid? projectId,
        CancellationToken cancellationToken = default);

    Task EnsurePendingApprovalRunsSealedForSummaryAsync(
        ScopeContext scope,
        IAuthorityQueryService authorityQueryService,
        IManifestHashService manifestHashService,
        CancellationToken cancellationToken = default);

    Task EnsureOpenDispositionTrailRunsSealedForSummaryAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid? projectId,
        ScopeContext scope,
        IAuthorityQueryService authorityQueryService,
        IManifestHashService manifestHashService,
        IFindingInspectReadRepository findingInspectReadRepository,
        CancellationToken cancellationToken = default);
}
