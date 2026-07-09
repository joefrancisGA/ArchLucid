using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Persistence.TechnologyLedger;
using ArchLucid.Contracts.Requests;

namespace ArchLucid.Core.TechnologyLedger;

public static class TechnologyLedgerEffectiveCloudTarget
{
    public static CloudProvider Resolve(
        ArchitectureRequest request,
        IReadOnlyList<TechnologyLedgerEntry> ledgerEntries)
    {
        ArgumentNullException.ThrowIfNull(request);
        ArgumentNullException.ThrowIfNull(ledgerEntries);

        TechnologyLedgerEntry? chosenCloudPlatform = ledgerEntries
            .FirstOrDefault(entry =>
                entry.Role == TechnologyLedgerRole.CloudPlatform
                && entry.Status == TechnologyLedgerStatus.Chosen);

        if (chosenCloudPlatform is not null)
            return chosenCloudPlatform.ProviderFamily;

        return request.CloudProvider;
    }
}
