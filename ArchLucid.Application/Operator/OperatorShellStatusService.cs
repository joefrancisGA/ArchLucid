using ArchLucid.Application.Budgeting;
using ArchLucid.Application.Common;
using ArchLucid.Application.Governance;
using ArchLucid.Application.OperatorHome;
using ArchLucid.Application.Tenancy;
using ArchLucid.Contracts.Alerts;
using ArchLucid.Contracts.Governance;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.CustomerSuccess;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;
using ArchLucid.Decisioning.Alerts;

using Microsoft.Extensions.Options;

namespace ArchLucid.Application.Operator;

public sealed class OperatorShellStatusService(
    IScopeContextProvider scopeProvider,
    IActorContext actorContext,
    ITenantRepository tenantRepository,
    ITenantMigrationStatusService tenantMigrationStatusService,
    ILlmMonthlyTenantDollarBudgetStatusService llmMonthlyBudgetStatusService,
    IAlertRecordRepository alertRecordRepository,
    ITenantUsageStatusService tenantUsageStatusService,
    IFeaturedCompletedSampleService featuredCompletedSampleService,
    IOperatorStickinessSnapshotReader stickinessSnapshotReader,
    IArchitectureRiskRegisterService architectureRiskRegisterService,
    IReviewsAwaitingActionQueryService reviewsAwaitingActionQueryService,
    IOptionsMonitor<TrialLifecycleSchedulerOptions> trialLifecycleSchedulerOptions) : IOperatorShellStatusService
{
    private readonly IActorContext _actorContext =
        actorContext ?? throw new ArgumentNullException(nameof(actorContext));

    private readonly IAlertRecordRepository _alertRecordRepository =
        alertRecordRepository ?? throw new ArgumentNullException(nameof(alertRecordRepository));

    private readonly IArchitectureRiskRegisterService _architectureRiskRegisterService =
        architectureRiskRegisterService
        ?? throw new ArgumentNullException(nameof(architectureRiskRegisterService));

    private readonly IFeaturedCompletedSampleService _featuredCompletedSampleService =
        featuredCompletedSampleService
        ?? throw new ArgumentNullException(nameof(featuredCompletedSampleService));

    private readonly ILlmMonthlyTenantDollarBudgetStatusService _llmMonthlyBudgetStatusService =
        llmMonthlyBudgetStatusService
        ?? throw new ArgumentNullException(nameof(llmMonthlyBudgetStatusService));

    private readonly IReviewsAwaitingActionQueryService _reviewsAwaitingActionQueryService =
        reviewsAwaitingActionQueryService
        ?? throw new ArgumentNullException(nameof(reviewsAwaitingActionQueryService));

    private readonly IScopeContextProvider _scopeProvider =
        scopeProvider ?? throw new ArgumentNullException(nameof(scopeProvider));

    private readonly IOperatorStickinessSnapshotReader _stickinessSnapshotReader =
        stickinessSnapshotReader ?? throw new ArgumentNullException(nameof(stickinessSnapshotReader));

    private readonly ITenantMigrationStatusService _tenantMigrationStatusService =
        tenantMigrationStatusService ?? throw new ArgumentNullException(nameof(tenantMigrationStatusService));

    private readonly ITenantRepository _tenantRepository =
        tenantRepository ?? throw new ArgumentNullException(nameof(tenantRepository));

    private readonly ITenantUsageStatusService _tenantUsageStatusService =
        tenantUsageStatusService ?? throw new ArgumentNullException(nameof(tenantUsageStatusService));

    private readonly IOptionsMonitor<TrialLifecycleSchedulerOptions> _trialLifecycleSchedulerOptions =
        trialLifecycleSchedulerOptions ?? throw new ArgumentNullException(nameof(trialLifecycleSchedulerOptions));

    public async Task<OperatorShellStatusResult> BuildAsync(
        bool includeLlmMonthlyBudgetStatus,
        bool includeAlertsInboxSummary,
        CancellationToken cancellationToken = default)
    {
        ScopeContext scope = _scopeProvider.GetCurrentScope();
        Task<OperatorShellTrialStatusSnapshot?> trialTask = BuildTrialStatusAsync(scope.TenantId, cancellationToken);
        Task<TenantMigrationStatusSnapshot> migrationTask =
            _tenantMigrationStatusService.GetForTenantAsync(scope.TenantId, cancellationToken);
        Task<LlmMonthlyTenantDollarBudgetStatusResult?> llmTask = includeLlmMonthlyBudgetStatus
            ? GetLlmBudgetStatusAsync(cancellationToken)
            : Task.FromResult<LlmMonthlyTenantDollarBudgetStatusResult?>(null);
        Task<AlertsInboxSummaryDto?> inboxTask = includeAlertsInboxSummary
            ? GetAlertsInboxSummaryAsync(scope, cancellationToken)
            : Task.FromResult<AlertsInboxSummaryDto?>(null);
        Task<TenantUsageStatusSnapshot?> usageTask =
            GetUsageStatusAsync(scope.TenantId, cancellationToken);
        Task<FeaturedCompletedSampleSnapshot?> homepageTask = GetHomepageSettingsAsync(cancellationToken);
        Task<OperatorShellStickinessSnapshot?> stickinessTask = GetStickinessSnapshotAsync(scope, cancellationToken);
        Task<int?> assignedToMeCountTask = GetAssignedToMeFindingsCountAsync(scope, cancellationToken);
        Task<GovernanceReviewsAwaitingActionResponse?> reviewsAwaitingTask =
            GetReviewsAwaitingActionAsync(scope, cancellationToken);

        await Task.WhenAll(
                trialTask,
                migrationTask,
                llmTask,
                inboxTask,
                usageTask,
                homepageTask,
                stickinessTask,
                assignedToMeCountTask,
                reviewsAwaitingTask)
            .ConfigureAwait(false);

        return new OperatorShellStatusResult
        {
            TrialStatus = await trialTask.ConfigureAwait(false),
            CatalogMigration = await migrationTask.ConfigureAwait(false),
            LlmMonthlyBudgetStatus = await llmTask.ConfigureAwait(false),
            AlertsInboxSummary = await inboxTask.ConfigureAwait(false),
            UsageStatus = await usageTask.ConfigureAwait(false),
            HomepageSettings = await homepageTask.ConfigureAwait(false),
            StickinessSnapshot = await stickinessTask.ConfigureAwait(false),
            AssignedToMeFindingsCount = await assignedToMeCountTask.ConfigureAwait(false),
            ReviewsAwaitingAction = await reviewsAwaitingTask.ConfigureAwait(false),
        };
    }

    private async Task<FeaturedCompletedSampleSnapshot?> GetHomepageSettingsAsync(CancellationToken cancellationToken)
    {
        try
        {
            return await _featuredCompletedSampleService.GetSnapshotAsync(cancellationToken).ConfigureAwait(false);
        }
        catch (OperationCanceledException)
        {
            throw;
        }
        catch
        {
            return null;
        }
    }

    private async Task<OperatorShellStickinessSnapshot?> GetStickinessSnapshotAsync(
        ScopeContext scope,
        CancellationToken cancellationToken)
    {
        try
        {
            PilotFunnelSnapshot funnel = await _stickinessSnapshotReader
                .GetFunnelSnapshotAsync(scope.TenantId, scope.WorkspaceId, scope.ProjectId, cancellationToken)
                .ConfigureAwait(false);
            OperatorStickinessSignals signals = await _stickinessSnapshotReader
                .GetOperatorSignalsAsync(scope.TenantId, scope.WorkspaceId, scope.ProjectId, cancellationToken)
                .ConfigureAwait(false);

            return OperatorShellStickinessSnapshotMapper.Map(funnel, signals);
        }
        catch (OperationCanceledException)
        {
            throw;
        }
        catch
        {
            return null;
        }
    }

    private async Task<int?> GetAssignedToMeFindingsCountAsync(
        ScopeContext scope,
        CancellationToken cancellationToken)
    {
        try
        {
            IReadOnlyList<string> identities = ArchitectureRiskRegisterAssignedToMeIdentityResolver.Resolve(_actorContext);

            if (identities.Count == 0)
                return 0;

            ArchitectureRiskRegisterListOptions options = new()
            {
                AssignedToUserIds = identities,
                OpenFindingsOnly = true,
            };

            return await _architectureRiskRegisterService
                .CountAsync(
                    scope.TenantId,
                    scope.WorkspaceId,
                    scope.ProjectId,
                    options,
                    cancellationToken)
                .ConfigureAwait(false);
        }
        catch (OperationCanceledException)
        {
            throw;
        }
        catch
        {
            return null;
        }
    }

    private async Task<GovernanceReviewsAwaitingActionResponse?> GetReviewsAwaitingActionAsync(
        ScopeContext scope,
        CancellationToken cancellationToken)
    {
        try
        {
            return await _reviewsAwaitingActionQueryService.ListAsync(scope, cancellationToken).ConfigureAwait(false);
        }
        catch (OperationCanceledException)
        {
            throw;
        }
        catch
        {
            return null;
        }
    }

    private async Task<TenantUsageStatusSnapshot?> GetUsageStatusAsync(
        Guid tenantId,
        CancellationToken cancellationToken)
    {
        try
        {
            return await _tenantUsageStatusService.BuildAsync(tenantId, cancellationToken).ConfigureAwait(false);
        }
        catch (OperationCanceledException)
        {
            throw;
        }
        catch
        {
            return null;
        }
    }

    private async Task<LlmMonthlyTenantDollarBudgetStatusResult?> GetLlmBudgetStatusAsync(
        CancellationToken cancellationToken)
    {
        try
        {
            return await _llmMonthlyBudgetStatusService.GetStatusAsync(cancellationToken).ConfigureAwait(false);
        }
        catch (OperationCanceledException)
        {
            throw;
        }
        catch
        {
            return null;
        }
    }

    private async Task<AlertsInboxSummaryDto?> GetAlertsInboxSummaryAsync(
        ScopeContext scope,
        CancellationToken cancellationToken)
    {
        try
        {
            return await _alertRecordRepository
                .GetInboxSummaryByScopeAsync(
                    scope.TenantId,
                    scope.WorkspaceId,
                    scope.ProjectId,
                    cancellationToken)
                .ConfigureAwait(false);
        }
        catch (OperationCanceledException)
        {
            throw;
        }
        catch
        {
            return null;
        }
    }

    private async Task<OperatorShellTrialStatusSnapshot?> BuildTrialStatusAsync(
        Guid tenantId,
        CancellationToken cancellationToken)
    {
        TenantRecord? tenant = await _tenantRepository.GetByIdAsync(tenantId, cancellationToken).ConfigureAwait(false);

        if (tenant is null)
            return null;

        if (string.IsNullOrWhiteSpace(tenant.TrialStatus))
        {
            return new OperatorShellTrialStatusSnapshot
            {
                Status = "None",
                TrialRunsUsed = tenant.TrialRunsUsed,
                TrialSeatsUsed = tenant.TrialSeatsUsed,
                TrialWelcomeRunId = tenant.TrialWelcomeRunId,
                FirstCommitUtc = tenant.TrialFirstManifestCommittedUtc,
            };
        }

        int? daysRemaining = null;

        if (!string.IsNullOrWhiteSpace(tenant.TrialStatus) &&
            tenant.TrialExpiresUtc is not null &&
            !string.Equals(tenant.TrialStatus, TrialLifecycleStatus.Converted, StringComparison.Ordinal))
        {
            daysRemaining = TrialLifecyclePolicy.ComputeDaysRemainingForStatusDisplay(
                tenant,
                TimeProvider.System.GetUtcNow(),
                _trialLifecycleSchedulerOptions.CurrentValue);
        }
        else if (tenant.TrialExpiresUtc is { } expires)
        {
            double totalDays = (expires - TimeProvider.System.GetUtcNow()).TotalDays;
            daysRemaining = (int)Math.Floor(totalDays);

            if (daysRemaining < 0)
                daysRemaining = 0;
        }

        return new OperatorShellTrialStatusSnapshot
        {
            Status = tenant.TrialStatus,
            DaysRemaining = daysRemaining,
            TrialRunsUsed = tenant.TrialRunsUsed,
            TrialRunsLimit = tenant.TrialRunsLimit,
            TrialSeatsUsed = tenant.TrialSeatsUsed,
            TrialSeatsLimit = tenant.TrialSeatsLimit,
            TrialSampleRunId = tenant.TrialSampleRunId,
            TrialWelcomeRunId = tenant.TrialWelcomeRunId,
            FirstCommitUtc = tenant.TrialFirstManifestCommittedUtc,
        };
    }
}
