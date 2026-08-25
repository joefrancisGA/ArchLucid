using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Governance.PolicyPacks;

namespace ArchLucid.Application.Governance.PolicyPacks;

/// <summary>Admin orchestration for platform catalog snapshots (promote/demote).</summary>
public interface IPolicyPackCatalogAdminService
{
    Task<PolicyPackCatalogEntryDetail?> TryPromoteFromSourcePackAsync(
        ScopeContext scope,
        Guid sourcePolicyPackId,
        string? version,
        CancellationToken ct);

    Task<bool> TryDemoteAsync(Guid policyPackCatalogEntryId, CancellationToken ct);
}
