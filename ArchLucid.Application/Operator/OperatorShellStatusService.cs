using ArchLucid.Application.Operator.Probes;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Application.Operator;

public sealed class OperatorShellStatusService(
    IScopeContextProvider scopeProvider,
    OperatorShellTrialStatusProbe trialStatusProbe,
    OperatorShellCatalogMigrationProbe catalogMigrationProbe,
    OperatorShellLlmMonthlyBudgetProbe llmMonthlyBudgetProbe,
    OperatorShellAlertsInboxProbe alertsInboxProbe,
    OperatorShellUsageStatusProbe usageStatusProbe,
    OperatorShellHomepageSettingsProbe homepageSettingsProbe,
    OperatorShellStickinessProbe stickinessProbe,
    OperatorShellAssignedToMeFindingsProbe assignedToMeFindingsProbe,
    OperatorShellReviewsAwaitingActionProbe reviewsAwaitingActionProbe) : IOperatorShellStatusService
{
    public async Task<OperatorShellStatusResult> BuildAsync(
        bool includeLlmMonthlyBudgetStatus,
        bool includeAlertsInboxSummary,
        CancellationToken cancellationToken = default)
    {
        OperatorShellStatusBuilder builder = new() { Scope = scopeProvider.GetCurrentScope() };

        List<Task> tasks =
        [
            trialStatusProbe.ProbeAsync(builder, cancellationToken),
            catalogMigrationProbe.ProbeAsync(builder, cancellationToken),
            usageStatusProbe.ProbeAsync(builder, cancellationToken),
            homepageSettingsProbe.ProbeAsync(builder, cancellationToken),
            stickinessProbe.ProbeAsync(builder, cancellationToken),
            assignedToMeFindingsProbe.ProbeAsync(builder, cancellationToken),
            reviewsAwaitingActionProbe.ProbeAsync(builder, cancellationToken),
        ];

        if (includeLlmMonthlyBudgetStatus)
            tasks.Add(llmMonthlyBudgetProbe.ProbeAsync(builder, cancellationToken));

        if (includeAlertsInboxSummary)
            tasks.Add(alertsInboxProbe.ProbeAsync(builder, cancellationToken));

        await Task.WhenAll(tasks).ConfigureAwait(false);
        return builder.Build();
    }
}
