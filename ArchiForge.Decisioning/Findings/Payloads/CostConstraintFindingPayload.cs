namespace ArchiForge.Decisioning.Findings.Payloads;

public class CostConstraintFindingPayload
{
    public string BudgetName { get; set; } = default!;
    public decimal? MaxMonthlyCost { get; set; }
    public string CostRisk { get; set; } = default!;
}

