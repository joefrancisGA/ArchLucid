namespace ArchLucid.Application.Operator;

public interface IOperatorShellStatusService
{
    Task<OperatorShellStatusResult> BuildAsync(
        bool includeLlmMonthlyBudgetStatus,
        bool includeAlertsInboxSummary,
        CancellationToken cancellationToken = default);
}
