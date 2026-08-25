using System.Diagnostics.CodeAnalysis;

using ArchLucid.Contracts.Governance;

namespace ArchLucid.Api.Models;

/// <summary>Aggregate response for bulk policy pack governance simulation.</summary>
[ExcludeFromCodeCoverage(Justification = "API response DTO; no business logic.")]
public sealed class PolicyPackSimulateBulkSummaryResponse
{
    public Guid PolicyPackId { get; set; }

    public string PolicyPackVersion { get; set; } = string.Empty;

    public int RequestedRunCount { get; set; }

    public int EvaluatedRunCount { get; set; }

    public int NotFoundRunCount { get; set; }

    public int WouldBlockCommitCount { get; set; }

    public List<PolicyPackSimulateBulkRunResult> Results { get; set; } = [];
}

/// <summary>Per-run outcome for bulk simulation.</summary>
[ExcludeFromCodeCoverage(Justification = "API response DTO; no business logic.")]
public sealed class PolicyPackSimulateBulkRunResult
{
    public string RunId { get; set; } = string.Empty;

    public bool Found { get; set; }

    public bool? WouldBlockCommit { get; set; }

    public PolicyPackGovernanceDryRunResult? Detail { get; set; }
}
