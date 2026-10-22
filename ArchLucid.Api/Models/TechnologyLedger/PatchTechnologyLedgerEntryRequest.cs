using System.Diagnostics.CodeAnalysis;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Persistence.TechnologyLedger;

namespace ArchLucid.Api.Models.TechnologyLedger;

/// <summary>Body for <c>PATCH /v1/runs/{runId}/technology-ledger/{entryId}</c>.</summary>
[ExcludeFromCodeCoverage(Justification = "API request/response DTO; no business logic.")]
public sealed class PatchTechnologyLedgerEntryRequest
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
