using System.Diagnostics.CodeAnalysis;

using ArchLucid.Contracts.Serialization;

namespace ArchLucid.Contracts.Alerts.Simulation;

/// <summary>
///     Side-by-side <see cref="RuleSimulationResult" /> from
///     <see cref="IRuleSimulationService.CompareCandidatesAsync" />.
/// </summary>
[ExcludeFromCodeCoverage(Justification = "Simulation result DTO; no logic.")]
public class RuleCandidateComparisonResult
{
    /// <summary>Simulation for candidate A.</summary>
    public RuleSimulationResult CandidateA
    {
        get;
        set;
    } = null!;

    /// <summary>Simulation for candidate B.</summary>
    public RuleSimulationResult CandidateB
    {
        get;
        set;
    } = null!;

    /// <summary>Cross-candidate summary lines (e.g. would-create counts).</summary>
    private List<string> summaryNotes = [];

    public List<string> SummaryNotes
    {
        get => summaryNotes;
        set => summaryNotes = ContractCollectionDefaults.Coalesce(value);
    }
}
