using System.Diagnostics.CodeAnalysis;

namespace ArchLucid.Api.Models.TechnologyLedger;

/// <summary>Response for <c>PATCH /v1/runs/{runId}/technology-ledger/{entryId}</c>.</summary>
[ExcludeFromCodeCoverage(Justification = "API request/response DTO; no business logic.")]
public sealed class PatchTechnologyLedgerEntryResponse
{
    public TechnologyLedgerEntryResponse Entry
    {
        get;
        init;
    } = null!;
}
