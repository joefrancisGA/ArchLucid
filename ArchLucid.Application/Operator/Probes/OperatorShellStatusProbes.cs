using ArchLucid.Application.Budgeting;
using ArchLucid.Application.Common;
using ArchLucid.Application.Governance;
using ArchLucid.Application.OperatorHome;
using ArchLucid.Application.Tenancy;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.CustomerSuccess;
using ArchLucid.Core.Tenancy;
using ArchLucid.Decisioning.Alerts;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;

namespace ArchLucid.Application.Operator.Probes;

public sealed class OperatorShellTrialStatusProbe(
    ITenantRepository tenants,
    IOptionsMonitor<TrialLifecycleSchedulerOptions> opts) : IOperatorShellStatusProbe
{
    public async Task ProbeAsync(OperatorShellStatusBuilder builder, CancellationToken cancellationToken)
    {
        TenantRecord? tenant = await tenants.GetByIdAsync(builder.Scope.TenantId, cancellationToken).ConfigureAwait(false);
        if (tenant is null)
            return;

        if (string.IsNullOrWhiteSpace(tenant.TrialStatus))
        {
            builder.TrialStatus = new OperatorShellTrialStatusSnapshot
            {
                Status = "None",
                TrialRunsUsed = tenant.TrialRunsUsed,
                TrialSeatsUsed = tenant.TrialSeatsUsed,
                TrialWelcomeRunId = tenant.TrialWelcomeRunId,
                FirstCommitUtc = tenant.TrialFirstManifestCommittedUtc,
            };
            return;
        }

        int? days = null;
        if (tenant.TrialExpiresUtc is not null
            && !string.Equals(tenant.TrialStatus, TrialLifecycleStatus.Converted, StringComparison.Ordinal))
        {
            days = TrialLifecyclePolicy.ComputeDaysRemainingForStatusDisplay(
                tenant,
                TimeProvider.System.GetUtcNow(),
                opts.CurrentValue);
        }

        builder.TrialStatus = new OperatorShellTrialStatusSnapshot
        {
            Status = tenant.TrialStatus,
            DaysRemaining = days,
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

public sealed class OperatorShellCatalogMigrationProbe(ITenantMigrationStatusService service) : IOperatorShellStatusProbe
{
    public async Task ProbeAsync(OperatorShellStatusBuilder builder, CancellationToken cancellationToken) =>
        builder.CatalogMigration = await service.GetForTenantAsync(builder.Scope.TenantId, cancellationToken).ConfigureAwait(false);
}

public sealed class OperatorShellLlmMonthlyBudgetProbe(ILlmMonthlyTenantDollarBudgetStatusService service) : IOperatorShellStatusProbe
{
    public async Task ProbeAsync(OperatorShellStatusBuilder builder, CancellationToken cancellationToken)
    {
        try
        {
            builder.LlmMonthlyBudgetStatus = await service.GetStatusAsync(cancellationToken).ConfigureAwait(false);
        }
        catch (OperationCanceledException)
        {
            throw;
        }
        catch
        {
            builder.LlmMonthlyBudgetStatus = null;
        }
    }
}

public sealed class OperatorShellAlertsInboxProbe(IAlertRecordRepository repository) : IOperatorShellStatusProbe
{
    public async Task ProbeAsync(OperatorShellStatusBuilder builder, CancellationToken cancellationToken)
    {
        try
        {
            builder.AlertsInboxSummary = await repository
                .GetInboxSummaryByScopeAsync(
                    builder.Scope.TenantId,
                    builder.Scope.WorkspaceId,
                    builder.Scope.ProjectId,
                    cancellationToken)
                .ConfigureAwait(false);
        }
        catch (OperationCanceledException)
        {
            throw;
        }
        catch
        {
            builder.AlertsInboxSummary = null;
        }
    }
}

public sealed class OperatorShellUsageStatusProbe(ITenantUsageStatusService service) : IOperatorShellStatusProbe
{
    public async Task ProbeAsync(OperatorShellStatusBuilder builder, CancellationToken cancellationToken)
    {
        try
        {
            builder.UsageStatus = await service.BuildAsync(builder.Scope.TenantId, cancellationToken).ConfigureAwait(false);
        }
        catch (OperationCanceledException)
        {
            throw;
        }
        catch
        {
            builder.UsageStatus = null;
        }
    }
}

public sealed class OperatorShellHomepageSettingsProbe(IFeaturedCompletedSampleService service) : IOperatorShellStatusProbe
{
    public async Task ProbeAsync(OperatorShellStatusBuilder builder, CancellationToken cancellationToken)
    {
        try
        {
            builder.HomepageSettings = await service.GetSnapshotAsync(cancellationToken).ConfigureAwait(false);
        }
        catch (OperationCanceledException)
        {
            throw;
        }
        catch
        {
            builder.HomepageSettings = null;
        }
    }
}

public sealed class OperatorShellStickinessProbe(IOperatorStickinessSnapshotReader reader) : IOperatorShellStatusProbe
{
    public async Task ProbeAsync(OperatorShellStatusBuilder builder, CancellationToken cancellationToken)
    {
        try
        {
            PilotFunnelSnapshot funnel = await reader
                .GetFunnelSnapshotAsync(
                    builder.Scope.TenantId,
                    builder.Scope.WorkspaceId,
                    builder.Scope.ProjectId,
                    cancellationToken)
                .ConfigureAwait(false);

            OperatorStickinessSignals signals = await reader
                .GetOperatorSignalsAsync(
                    builder.Scope.TenantId,
                    builder.Scope.WorkspaceId,
                    builder.Scope.ProjectId,
                    cancellationToken)
                .ConfigureAwait(false);

            builder.StickinessSnapshot = OperatorShellStickinessSnapshotMapper.Map(funnel, signals);
        }
        catch (OperationCanceledException)
        {
            throw;
        }
        catch
        {
            builder.StickinessSnapshot = null;
        }
    }
}

public sealed class OperatorShellAssignedToMeFindingsProbe(
    IActorContext actor,
    IArchitectureRiskRegisterService register) : IOperatorShellStatusProbe
{
    public async Task ProbeAsync(OperatorShellStatusBuilder builder, CancellationToken cancellationToken)
    {
        try
        {
            IReadOnlyList<string> ids = ArchitectureRiskRegisterAssignedToMeIdentityResolver.Resolve(actor);
            if (ids.Count == 0)
            {
                builder.AssignedToMeFindingsCount = 0;
                return;
            }

            builder.AssignedToMeFindingsCount = await register.CountAsync(
                builder.Scope.TenantId,
                builder.Scope.WorkspaceId,
                builder.Scope.ProjectId,
                new ArchitectureRiskRegisterListOptions
                {
                    AssignedToUserIds = ids,
                    OpenFindingsOnly = true,
                },
                cancellationToken).ConfigureAwait(false);
        }
        catch (OperationCanceledException)
        {
            throw;
        }
        catch
        {
            builder.AssignedToMeFindingsCount = null;
        }
    }
}

public sealed class OperatorShellReviewsAwaitingActionProbe(IReviewsAwaitingActionQueryService service) : IOperatorShellStatusProbe
{
    public async Task ProbeAsync(OperatorShellStatusBuilder builder, CancellationToken cancellationToken)
    {
        try
        {
            builder.ReviewsAwaitingAction = await service.ListAsync(builder.Scope, cancellationToken).ConfigureAwait(false);
        }
        catch (OperationCanceledException)
        {
            throw;
        }
        catch
        {
            builder.ReviewsAwaitingAction = null;
        }
    }
}

public static class OperatorShellStatusProbeServiceCollectionExtensions
{
    public static IServiceCollection AddOperatorShellStatusProbes(this IServiceCollection services)
    {
        services.AddScoped<OperatorShellTrialStatusProbe>();
        services.AddScoped<OperatorShellCatalogMigrationProbe>();
        services.AddScoped<OperatorShellLlmMonthlyBudgetProbe>();
        services.AddScoped<OperatorShellAlertsInboxProbe>();
        services.AddScoped<OperatorShellUsageStatusProbe>();
        services.AddScoped<OperatorShellHomepageSettingsProbe>();
        services.AddScoped<OperatorShellStickinessProbe>();
        services.AddScoped<OperatorShellAssignedToMeFindingsProbe>();
        services.AddScoped<OperatorShellReviewsAwaitingActionProbe>();
        return services;
    }
}
