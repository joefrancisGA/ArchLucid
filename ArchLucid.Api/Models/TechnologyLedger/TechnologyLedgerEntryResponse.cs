using System.Diagnostics.CodeAnalysis;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Persistence.TechnologyLedger;

namespace ArchLucid.Api.Models.TechnologyLedger;

/// <summary>Outward Technology Ledger row for operator baseline review.</summary>
[ExcludeFromCodeCoverage(Justification = "API request/response DTO; no business logic.")]
public sealed class TechnologyLedgerEntryResponse
{
    public string EntryId
    {
        get;
        init;
    } = string.Empty;

    public string RunId
    {
        get;
        init;
    } = string.Empty;

    public TechnologyLedgerRole Role
    {
        get;
        init;
    }

    public string TechnologyName
    {
        get;
        init;
    } = string.Empty;

    public CloudProvider ProviderFamily
    {
        get;
        init;
    }

    public TechnologyLedgerStatus Status
    {
        get;
        init;
    }

    public TechnologyLedgerSource Source
    {
        get;
        init;
    }

    public string? EvidenceRef
    {
        get;
        init;
    }

    public string? Rationale
    {
        get;
        init;
    }

    public bool IsLocked
    {
        get;
        init;
    }

    public DateTime CreatedUtc
    {
        get;
        init;
    }

    public DateTime UpdatedUtc
    {
        get;
        init;
    }
}
