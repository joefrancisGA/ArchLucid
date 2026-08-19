namespace ArchLucid.Contracts.Exports;

/// <summary>SAQ-011 labeled cost-avoidance narrative on a decision receipt (ADR 0052).</summary>
public sealed class DecisionReceiptCostStory
{
    public string Label
    {
        get;
        set;
    } = DecisionReceiptConstants.CostEstimateLabel;

    public decimal SessionCostUsdEstimate
    {
        get;
        set;
    } = 1m;

    public decimal AvoidedHumanArchitectCostUsdEstimate
    {
        get;
        set;
    } = 25_000m;

    public string AvoidedCalendarWeeksEstimate
    {
        get;
        set;
    } = "2–4";

    public string Narrative
    {
        get;
        set;
    } =
        "A defensible decision delivered in minutes at low compute cost versus weeks of human architecture review.";
}
