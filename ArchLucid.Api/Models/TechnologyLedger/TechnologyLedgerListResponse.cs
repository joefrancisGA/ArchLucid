using System.Diagnostics.CodeAnalysis;

namespace ArchLucid.Api.Models.TechnologyLedger;

/// <summary>Response for <c>GET /v1/runs/{runId}/technology-ledger</c>.</summary>
[ExcludeFromCodeCoverage(Justification = "API request/response DTO; no business logic.")]
public sealed class TechnologyLedgerListResponse
{
    public string RunId
    {
        get;
        init;
    } = string.Empty;

    public IReadOnlyList<TechnologyLedgerEntryResponse> Entries
    {
        get;
        init;
    } = [];
}
