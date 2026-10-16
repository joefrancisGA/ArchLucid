using ArchLucid.Contracts.Governance;

namespace ArchLucid.Application.Governance;

/// <summary>
///     Application workflow facade for governance promotion, activation, and run-history HTTP routes.
/// </summary>
public interface IGovernancePromotionsActivationsFacade
{
    Task<GovernancePromotionRecord> PromoteAsync(
        string runId,
        string manifestVersion,
        string sourceEnvironment,
        string targetEnvironment,
        string promotedBy,
        string? approvalRequestId,
        string? notes,
        bool dryRun,
        bool verbosePromotionValidationErrors,
        string? promotedByDisplay,
        CancellationToken ct);

    Task<GovernanceEnvironmentActivation> ActivateAsync(
        string runId,
        string manifestVersion,
        string environment,
        string activatedBy,
        string? activatedByDisplay,
        CancellationToken ct);

    Task<IReadOnlyList<GovernanceApprovalRequest>> ListApprovalRequestsByRunIdAsync(
        string runId,
        CancellationToken ct);

    Task<IReadOnlyList<GovernancePromotionRecord>> ListPromotionsByRunIdAsync(
        string runId,
        CancellationToken ct);

    Task<IReadOnlyList<GovernanceEnvironmentActivation>> ListActivationsByRunIdAsync(
        string runId,
        CancellationToken ct);
}
