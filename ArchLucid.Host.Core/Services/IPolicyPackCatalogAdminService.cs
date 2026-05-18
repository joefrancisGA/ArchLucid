using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Governance.PolicyPacks;

namespace ArchLucid.Host.Core.Services;

/// <summary>Admin orchestration for platform catalog snapshots (promote/demote).</summary>
public interface IPolicyPackCatalogAdminService
{
    /// <summary>
    ///     Snapshots a policy pack version from the caller&apos;s authoring scope into the global catalog and marks it
    ///     promoted.
    /// </summary>
    /// <returns><c>null</c> when the pack or version is not found in scope.</returns>
    Task<PolicyPackCatalogEntryDetail?> TryPromoteFromSourcePackAsync(
        ScopeContext scope,
        Guid sourcePolicyPackId,
        string? version,
        CancellationToken ct);

    /// <summary>Demotes a catalog entry (buyers no longer see it in list/detail).</summary>
    Task<bool> TryDemoteAsync(Guid policyPackCatalogEntryId, CancellationToken ct);
}
