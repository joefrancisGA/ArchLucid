using ArchLucid.Application.Budgeting;
using ArchLucid.Application.Tenancy;
using ArchLucid.Contracts.Alerts;

namespace ArchLucid.Application.Operator;

public sealed class OperatorShellStatusResult
{
    public OperatorShellTrialStatusSnapshot? TrialStatus { get; init; }

    public TenantMigrationStatusSnapshot? CatalogMigration { get; init; }

    public LlmMonthlyTenantDollarBudgetStatusResult? LlmMonthlyBudgetStatus { get; init; }

    public AlertsInboxSummaryDto? AlertsInboxSummary { get; init; }
}
