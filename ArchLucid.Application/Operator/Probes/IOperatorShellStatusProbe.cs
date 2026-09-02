using ArchLucid.Application.Budgeting;
using ArchLucid.Application.OperatorHome;
using ArchLucid.Application.Tenancy;
using ArchLucid.Contracts.Alerts;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Governance;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;

namespace ArchLucid.Application.Operator.Probes;

public sealed class OperatorShellStatusBuilder
{
    public required ScopeContext Scope { get; init; }
    public OperatorShellTrialStatusSnapshot? TrialStatus { get; set; }
    public TenantMigrationStatusSnapshot? CatalogMigration { get; set; }
    public LlmMonthlyTenantDollarBudgetStatusResult? LlmMonthlyBudgetStatus { get; set; }
    public AlertsInboxSummaryDto? AlertsInboxSummary { get; set; }
    public TenantUsageStatusSnapshot? UsageStatus { get; set; }
    public FeaturedCompletedSampleSnapshot? HomepageSettings { get; set; }
    public OperatorShellStickinessSnapshot? StickinessSnapshot { get; set; }
    public int? AssignedToMeFindingsCount { get; set; }
    public GovernanceReviewsAwaitingActionResponse? ReviewsAwaitingAction { get; set; }

    public OperatorShellStatusResult Build() => new()
    {
        TrialStatus = TrialStatus,
        CatalogMigration = CatalogMigration,
        LlmMonthlyBudgetStatus = LlmMonthlyBudgetStatus,
        AlertsInboxSummary = AlertsInboxSummary,
        UsageStatus = UsageStatus,
        HomepageSettings = HomepageSettings,
        StickinessSnapshot = StickinessSnapshot,
        AssignedToMeFindingsCount = AssignedToMeFindingsCount,
        ReviewsAwaitingAction = ReviewsAwaitingAction,
    };
}

public interface IOperatorShellStatusProbe
{
    Task ProbeAsync(OperatorShellStatusBuilder builder, CancellationToken cancellationToken);
}
