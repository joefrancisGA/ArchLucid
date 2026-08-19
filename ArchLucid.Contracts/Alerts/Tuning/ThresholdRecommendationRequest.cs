using ArchLucid.Contracts.Advisory.Scheduling;
using ArchLucid.Contracts.Alerts;
using ArchLucid.Contracts.Alerts.Composite;

namespace ArchLucid.Contracts.Alerts.Tuning;

/// <summary>Request to sweep candidate thresholds for one tunable metric on a base simple or composite rule.</summary>
public class ThresholdRecommendationRequest
{
    public string RuleKind
    {
        get;
        set;
    } = null!;

    public AlertRule? BaseSimpleRule
    {
        get;
        set;
    }

    public CompositeAlertRule? BaseCompositeRule
    {
        get;
        set;
    }

    public string TunedMetricType
    {
        get;
        set;
    } = null!;

    public List<decimal> CandidateThresholds
    {
        get;
        set;
    } = [];

    public int RecentRunCount
    {
        get;
        set;
    } = 10;

    public int TargetCreatedAlertCountMin
    {
        get;
        set;
    } = 1;

    public int TargetCreatedAlertCountMax
    {
        get;
        set;
    } = 5;

    public string RunProjectSlug
    {
        get;
        set;
    } = AdvisoryScanSchedule.DefaultProjectSlug;
}
