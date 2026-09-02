using ArchLucid.Application.Governance.Workflow;
using ArchLucid.Application.Runs;
using ArchLucid.Contracts.Governance;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Interfaces;

namespace ArchLucid.Application.Governance;

/// <summary>
///     Default <see cref="IGovernancePromotionsActivationsFacade"/> consolidating promotion and activation route
///     orchestration previously in <c>GovernanceController.PromotionsActivations</c>.
/// </summary>
public sealed class GovernancePromotionsActivationsFacade(
    IGovernanceWorkflowFacade workflowFacade,
    IGovernanceApprovalRequestRepository approvalRepo,
    IGovernancePromotionRecordRepository promotionRepo,
    IGovernanceEnvironmentActivationRepository activationRepo,
    IScopeContextProvider scopeContextProvider,
    IRunRepository runRepository) : IGovernancePromotionsActivationsFacade
{
    private readonly IGovernanceWorkflowFacade _workflowFacade =
        workflowFacade ?? throw new ArgumentNullException(nameof(workflowFacade));

    private readonly IGovernanceApprovalRequestRepository _approvalRepo =
        approvalRepo ?? throw new ArgumentNullException(nameof(approvalRepo));

    private readonly IGovernancePromotionRecordRepository _promotionRepo =
        promotionRepo ?? throw new ArgumentNullException(nameof(promotionRepo));

    private readonly IGovernanceEnvironmentActivationRepository _activationRepo =
        activationRepo ?? throw new ArgumentNullException(nameof(activationRepo));

    private readonly IScopeContextProvider _scopeContextProvider =
        scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    private readonly IRunRepository _runRepository =
        runRepository ?? throw new ArgumentNullException(nameof(runRepository));

    /// <inheritdoc />
    public async Task<GovernancePromotionRecord> PromoteAsync(
        string runId,
        string manifestVersion,
        string sourceEnvironment,
        string targetEnvironment,
        string promotedBy,
        string? approvalRequestId,
        string? notes,
        bool dryRun,
        bool verbosePromotionValidationErrors,
        CancellationToken ct)
    {
        string normalizedRunId = await GovernanceRunScope.RequireScopedRunIdAsync(
            _scopeContextProvider,
            _runRepository,
            runId,
            ct);

        string? normalizedApprovalRequestId = null;

        if (approvalRequestId is not null)
        {
            normalizedApprovalRequestId = approvalRequestId.Trim();

            if (string.IsNullOrWhiteSpace(normalizedApprovalRequestId))
                throw new ArgumentException("approvalRequestId is required.");

            GovernanceApprovalRequest? approval = await _approvalRepo
                .GetByIdAsync(normalizedApprovalRequestId, ct)
                .ConfigureAwait(false);

            if (approval is null)
                throw new KeyNotFoundException($"Approval request '{normalizedApprovalRequestId}' was not found.");

            await GovernanceRunScope.RequireScopedRunIdAsync(
                _scopeContextProvider,
                _runRepository,
                approval.RunId,
                ct);
        }

        return await _workflowFacade.PromoteAsync(
            normalizedRunId,
            manifestVersion,
            sourceEnvironment,
            targetEnvironment,
            promotedBy,
            normalizedApprovalRequestId,
            notes,
            dryRun,
            verbosePromotionValidationErrors,
            ct);
    }

    /// <inheritdoc />
    public async Task<GovernanceEnvironmentActivation> ActivateAsync(
        string runId,
        string manifestVersion,
        string environment,
        string activatedBy,
        CancellationToken ct)
    {
        string normalizedRunId = await GovernanceRunScope.RequireScopedRunIdAsync(
            _scopeContextProvider,
            _runRepository,
            runId,
            ct);

        return await _workflowFacade.ActivateAsync(
            normalizedRunId,
            manifestVersion,
            environment,
            activatedBy,
            ct);
    }

    /// <inheritdoc />
    public async Task<IReadOnlyList<GovernanceApprovalRequest>> ListApprovalRequestsByRunIdAsync(
        string runId,
        CancellationToken ct)
    {
        string normalizedRunId = await GovernanceRunScope.RequireScopedRunIdAsync(
            _scopeContextProvider,
            _runRepository,
            runId,
            ct);

        return await _approvalRepo.GetByRunIdAsync(normalizedRunId, ct);
    }

    /// <inheritdoc />
    public async Task<IReadOnlyList<GovernancePromotionRecord>> ListPromotionsByRunIdAsync(
        string runId,
        CancellationToken ct)
    {
        string normalizedRunId = await GovernanceRunScope.RequireScopedRunIdAsync(
            _scopeContextProvider,
            _runRepository,
            runId,
            ct);

        return await _promotionRepo.GetByRunIdAsync(normalizedRunId, ct);
    }

    /// <inheritdoc />
    public async Task<IReadOnlyList<GovernanceEnvironmentActivation>> ListActivationsByRunIdAsync(
        string runId,
        CancellationToken ct)
    {
        string normalizedRunId = await GovernanceRunScope.RequireScopedRunIdAsync(
            _scopeContextProvider,
            _runRepository,
            runId,
            ct);

        return await _activationRepo.GetByRunIdAsync(normalizedRunId, ct);
    }
}
