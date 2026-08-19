using ArchLucid.Api.Models.TechnologyLedger;
using ArchLucid.Contracts.Persistence.TechnologyLedger;

namespace ArchLucid.Api.Mapping;

internal static class TechnologyLedgerEntryMapper
{
    public static TechnologyLedgerEntryResponse ToResponse(TechnologyLedgerEntry entry)
    {
        ArgumentNullException.ThrowIfNull(entry);

        return new TechnologyLedgerEntryResponse
        {
            EntryId = entry.EntryId,
            RunId = entry.RunId,
            Role = entry.Role,
            TechnologyName = entry.TechnologyName,
            ProviderFamily = entry.ProviderFamily,
            Status = entry.Status,
            Source = entry.Source,
            EvidenceRef = entry.EvidenceRef,
            Rationale = entry.Rationale,
            IsLocked = entry.IsLocked,
            CreatedUtc = entry.CreatedUtc,
            UpdatedUtc = entry.UpdatedUtc,
        };
    }
}
