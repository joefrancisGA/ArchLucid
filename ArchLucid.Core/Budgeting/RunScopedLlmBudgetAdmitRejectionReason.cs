namespace ArchLucid.Core.Budgeting;

public enum RunScopedLlmBudgetAdmitRejectionReason
{
    Disabled = 0,
    RunCostBudgetExceeded = 1,
    MonthlyQuotaExceeded = 2,
    StoreUnavailable = 3,
}
