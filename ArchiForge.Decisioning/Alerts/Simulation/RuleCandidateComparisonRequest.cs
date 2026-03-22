using ArchiForge.Decisioning.Alerts;
using ArchiForge.Decisioning.Alerts.Composite;

namespace ArchiForge.Decisioning.Alerts.Simulation;

public class RuleCandidateComparisonRequest
{
    public string RuleKind { get; set; } = null!;

    public AlertRule? CandidateASimpleRule { get; set; }
    public AlertRule? CandidateBSimpleRule { get; set; }

    public CompositeAlertRule? CandidateACompositeRule { get; set; }
    public CompositeAlertRule? CandidateBCompositeRule { get; set; }

    public int RecentRunCount { get; set; } = 5;

    public string RunProjectSlug { get; set; } = "default";
}
