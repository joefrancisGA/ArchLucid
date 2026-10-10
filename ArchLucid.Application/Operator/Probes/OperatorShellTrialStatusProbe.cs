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
