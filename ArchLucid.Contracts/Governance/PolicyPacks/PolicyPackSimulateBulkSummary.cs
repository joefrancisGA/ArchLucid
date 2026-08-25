using ArchLucid.Contracts.Governance;

namespace ArchLucid.Contracts.Governance.PolicyPacks;

/// <summary>Aggregate response for bulk policy pack governance simulation.</summary>
public class PolicyPackSimulateBulkSummary
{
    public Guid PolicyPackId { get; set; }

    public string PolicyPackVersion { get; set; } = string.Empty;

    public int RequestedRunCount { get; set; }

    public int EvaluatedRunCount { get; set; }

    public int NotFoundRunCount { get; set; }

    public int WouldBlockCommitCount { get; set; }

    public List<PolicyPackSimulateBulkRunOutcome> Results { get; set; } = [];
}

/// <summary>Per-run outcome for bulk simulation.</summary>
public class PolicyPackSimulateBulkRunOutcome
{
    public string RunId { get; set; } = string.Empty;

    public bool Found { get; set; }

    public bool? WouldBlockCommit { get; set; }

    public PolicyPackGovernanceDryRunResult? Detail { get; set; }
}
