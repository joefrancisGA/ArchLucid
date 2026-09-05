namespace ArchLucid.Core.Configuration;

public sealed partial class QuickScanSafetyOptionsValidator
{
    private static void ValidateIdentity(QuickScanSafetyIdentityLimits limits, List<string> failures)
    {
        AppendPositive(failures, limits.MaxScansPerSessionPerHour, $"{Prefix}.Identity.MaxScansPerSessionPerHour");
        AppendPositive(failures, limits.MaxScansPerSessionPerDay, $"{Prefix}.Identity.MaxScansPerSessionPerDay");
        AppendPositive(failures, limits.MaxScansPerBrowserPerHour, $"{Prefix}.Identity.MaxScansPerBrowserPerHour");
        AppendPositive(failures, limits.MaxScansPerBrowserPerDay, $"{Prefix}.Identity.MaxScansPerBrowserPerDay");
        AppendPositive(failures, limits.MaxScansPerIpPerHour, $"{Prefix}.Identity.MaxScansPerIpPerHour");
        AppendPositive(failures, limits.MaxScansPerIpPerDay, $"{Prefix}.Identity.MaxScansPerIpPerDay");
        AppendPositive(failures, limits.MaxScansPerIpRangePerHour, $"{Prefix}.Identity.MaxScansPerIpRangePerHour");
        AppendPositive(failures, limits.MaxScansPerIpRangePerDay, $"{Prefix}.Identity.MaxScansPerIpRangePerDay");
    }

    private static void ValidateGlobalRequests(QuickScanSafetyGlobalRequestLimits limits, List<string> failures)
    {
        AppendPositive(failures, limits.MaxAnonymousRequestsPerHour, $"{Prefix}.GlobalRequests.MaxAnonymousRequestsPerHour");
        AppendPositive(failures, limits.MaxAnonymousRequestsPerDay, $"{Prefix}.GlobalRequests.MaxAnonymousRequestsPerDay");
    }

    private static void ValidateGlobalBudget(QuickScanSafetyGlobalBudgetLimits limits, List<string> failures)
    {
        AppendNonNegativeMoney(failures, limits.MaxAnonymousSpendPerHour, $"{Prefix}.GlobalBudget.MaxAnonymousSpendPerHour");
        AppendNonNegativeMoney(failures, limits.MaxAnonymousSpendPerDay, $"{Prefix}.GlobalBudget.MaxAnonymousSpendPerDay");
        AppendPositive(failures, limits.BudgetReservationTtlMinutes, $"{Prefix}.GlobalBudget.BudgetReservationTtlMinutes");
        AppendNonNegativeMoney(failures, limits.BudgetAccountingGracePercent, $"{Prefix}.GlobalBudget.BudgetAccountingGracePercent");
    }
}
