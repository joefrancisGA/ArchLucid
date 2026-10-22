using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Persistence.TechnologyLedger;

namespace ArchLucid.Application.Runs.TechnologyLedger;

/// <summary>Application-layer partial update for a single Technology Ledger entry.</summary>
public sealed class PatchTechnologyLedgerEntryCommand
{
    public TechnologyLedgerStatus? Status
    {
        get;
        init;
    }

    public bool? IsLocked
    {
        get;
        init;
    }

    public string? Rationale
    {
        get;
        init;
    }

    public string? TechnologyName
    {
        get;
        init;
    }

    public CloudProvider? ProviderFamily
    {
        get;
        init;
    }

    public bool HasChanges() =>
        Status.HasValue
        || IsLocked.HasValue
        || Rationale is not null
        || TechnologyName is not null
        || ProviderFamily.HasValue;
}
