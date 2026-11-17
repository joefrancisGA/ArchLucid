namespace ArchLucid.Capabilities.Cost;

internal static class CostConstraintFindingHonesty
{
    public const string BudgetNameNotStored = "Budget name was not stored.";

    public const string CostRiskNotStored = "Cost risk was not stored.";

    public const string PolicyRequiredCapBudgetLabel = "Policy-required monthly budget cap";

    public const string ProjectedSpendIllustrativeRationaleSuffix =
        "Projected spend uses illustrative pricing — not measured tenant spend.";

    public const string TopologyInstanceCountAssumedNote =
        "Instance count was not stored on one or more topology rows; quantity 1 was assumed for costing.";

    public const string UnknownPlatformIllustrativePlaceholderNote =
        "Unknown runtime platform uses a $25/month illustrative placeholder — not measured spend.";
}
