using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;

namespace ArchLucid.Application.Tenancy;

/// <summary>
/// Server-side trial write gate: loads <c>dbo.Tenants</c> trial columns and rejects mutating work when the tenant is on an
/// active self-service trial that has expired or exhausted runs/seats.
/// </summary>
public sealed class TrialLimitGate(ITenantRepository tenantRepository, TimeProvider timeProvider)
{
    private readonly ITenantRepository _tenantRepository =
        tenantRepository ?? throw new ArgumentNullException(nameof(tenantRepository));

    private readonly TimeProvider _timeProvider = timeProvider ?? throw new ArgumentNullException(nameof(timeProvider));

    /// <summary>
    /// Throws <see cref="TrialLimitExceededException"/> when the tenant must not accept mutating authority operations.
    /// </summary>
    public async Task GuardWriteAsync(ScopeContext scope, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(scope);

        if (scope.TenantId == Guid.Empty)
            return;

        TenantRecord? tenant = await _tenantRepository.GetByIdAsync(scope.TenantId, cancellationToken);

        if (tenant is null)
            return;

        if (string.IsNullOrWhiteSpace(tenant.TrialStatus) ||
            string.Equals(tenant.TrialStatus, TrialLifecycleStatus.Converted, StringComparison.Ordinal))
        {
            return;
        }

        if (!string.Equals(tenant.TrialStatus, TrialLifecycleStatus.Active, StringComparison.Ordinal))
            return;

        DateTimeOffset now = _timeProvider.GetUtcNow();
        int daysRemaining = ComputeDaysRemaining(tenant.TrialExpiresUtc, now);

        if (tenant.TrialExpiresUtc is { } exp && exp <= now)
        {
            throw new TrialLimitExceededException(TrialLimitReason.Expired, daysRemaining: 0);
        }

        if (tenant.TrialRunsLimit is { } runLimit && tenant.TrialRunsUsed >= runLimit)
        {
            throw new TrialLimitExceededException(TrialLimitReason.RunsExceeded, daysRemaining);
        }

        if (tenant.TrialSeatsLimit is { } seatLimit && tenant.TrialSeatsUsed >= seatLimit)
        {
            throw new TrialLimitExceededException(TrialLimitReason.SeatsExceeded, daysRemaining);
        }
    }

    private static int ComputeDaysRemaining(DateTimeOffset? trialExpiresUtc, DateTimeOffset now)
    {
        if (trialExpiresUtc is null)
            return 0;

        double totalDays = (trialExpiresUtc.Value - now).TotalDays;
        int days = (int)Math.Floor(totalDays);

        return days < 0 ? 0 : days;
    }
}
