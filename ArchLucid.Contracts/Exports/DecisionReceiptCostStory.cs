namespace ArchLucid.Contracts.Exports;

/// <summary>SAQ-011 labeled cost-avoidance narrative on a decision receipt (ADR 0052).</summary>
public sealed class DecisionReceiptCostStory
{
    public const string SessionCostNotStored = "Session cost was not stored.";

    public const string AvoidedHumanArchitectCostNotStored = "Avoided human architect cost was not stored.";

    public const string AvoidedCalendarWeeksNotStored = "Avoided calendar time was not stored.";

    public const string DefaultNarrative =
        "Session cost, avoided architect cost, and avoided calendar time were not stored on this receipt.";

    public string Label
    {
        get;
        set;
    } = DecisionReceiptConstants.CostEstimateLabel;

    public string SessionCostUsdEstimate
    {
        get;
        set;
    } = SessionCostNotStored;

    public string AvoidedHumanArchitectCostUsdEstimate
    {
        get;
        set;
    } = AvoidedHumanArchitectCostNotStored;

    public string AvoidedCalendarWeeksEstimate
    {
        get;
        set;
    } = AvoidedCalendarWeeksNotStored;

    public string Narrative
    {
        get;
        set;
    } = DefaultNarrative;
}
