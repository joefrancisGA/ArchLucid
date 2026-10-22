using ArchLucid.Contracts.Governance.PolicyPacks;

namespace ArchLucid.Core.Persistence.Ports;

/// <summary>Persistence port for <c>dbo.PlatformBundledPolicyPackRegistry</c>.</summary>
public interface IPlatformBundledPolicyPackRegistryRepository
{
    Task<IReadOnlyList<PlatformBundledPolicyPackRegistryEntry>> ListAllAsync(CancellationToken ct);

    Task UpsertAsync(PlatformBundledPolicyPackRegistryEntry entry, CancellationToken ct);

    Task<bool> TrySetGloballyActiveAsync(string bundleContentFile, bool isGloballyActive, CancellationToken ct);
}
