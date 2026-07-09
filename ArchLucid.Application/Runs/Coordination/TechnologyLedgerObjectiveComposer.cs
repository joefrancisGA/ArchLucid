using ArchLucid.Core.TechnologyLedger;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Persistence.TechnologyLedger;
using ArchLucid.Contracts.Requests;

namespace ArchLucid.Application.Runs.Coordination;

public static class TechnologyLedgerObjectiveComposer
{
    public static string BuildTopologyObjective(
        ArchitectureRequest request,
        IReadOnlyList<TechnologyLedgerEntry> ledgerEntries)
    {
        ArgumentNullException.ThrowIfNull(request);
        ArgumentNullException.ThrowIfNull(ledgerEntries);

        CloudProvider effectiveTarget = TechnologyLedgerEffectiveCloudTarget.Resolve(request, ledgerEntries);
        string providerLabel = ResolveProviderLabel(effectiveTarget);

        return $"Design an initial {providerLabel} topology for system '{request.SystemName}' " +
               $"in environment '{request.Environment}'. {request.Description}";
    }

    private static string ResolveProviderLabel(CloudProvider provider) => provider switch
    {
        CloudProvider.Azure => "Azure",
        CloudProvider.Aws => "AWS",
        CloudProvider.Gcp => "GCP",
        _ => "cloud-neutral",
    };
}
