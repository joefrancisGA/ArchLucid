using System.Collections.Concurrent;
using System.Data;

using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;

using JetBrains.Annotations;

namespace ArchLucid.Persistence.Tenancy;

public sealed partial class InMemoryTenantRepository
{
    public Task TryIncrementActiveTrialRunAsync(
        Guid tenantId,
        CancellationToken ct,
        IDbConnection? connection = null,
        IDbTransaction? transaction = null)
    {
        _ = connection;
        _ = transaction;
        _ = ct;

        lock (_trialGate)
        {
            if (!_byId.TryGetValue(tenantId, out TenantRecord? t) ||
                !string.Equals(t.TrialStatus, TrialLifecycleStatus.Active, StringComparison.Ordinal) ||
                t.TrialRunsLimit is not { } runCap ||
                runCap < 1)
                return Task.CompletedTask;

            DateTimeOffset now = TimeProvider.System.GetUtcNow();

            if (t.TrialExpiresUtc is { } exp && exp <= now)

                throw new TrialLimitExceededException(
                    TrialLimitReason.Expired,
                    ComputeDaysRemaining(t.TrialExpiresUtc));

            if (t.TrialRunsUsed >= runCap)

                throw new TrialLimitExceededException(
                    TrialLimitReason.RunsExceeded,
                    ComputeDaysRemaining(t.TrialExpiresUtc));

            _byId[tenantId] = CopyTenant(t, trialRunsUsed: t.TrialRunsUsed + 1);
        }

        return Task.CompletedTask;
    }


    /// <inheritdoc />
    public Task TryClaimTrialSeatAsync(Guid tenantId, string principalKey, CancellationToken ct)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(principalKey);
        _ = ct;

        string key = principalKey.Trim();

        lock (_trialGate)
        {
            if (!_byId.TryGetValue(tenantId, out TenantRecord? t) ||
                !string.Equals(t.TrialStatus, TrialLifecycleStatus.Active, StringComparison.Ordinal) ||
                t.TrialSeatsLimit is not { } seatCap ||
                seatCap < 1)
                return Task.CompletedTask;

            if (t.TrialExpiresUtc is { } exp && exp <= TimeProvider.System.GetUtcNow())

                throw new TrialLimitExceededException(
                    TrialLimitReason.Expired,
                    ComputeDaysRemaining(t.TrialExpiresUtc));

            if (_trialSeatOccupants.ContainsKey((tenantId, key)))
                return Task.CompletedTask;

            if (t.TrialSeatsUsed >= seatCap)

                throw new TrialLimitExceededException(
                    TrialLimitReason.SeatsExceeded,
                    ComputeDaysRemaining(t.TrialExpiresUtc));

            _trialSeatOccupants[(tenantId, key)] = 1;

            _byId[tenantId] = CopyTenant(t, trialSeatsUsed: t.TrialSeatsUsed + 1);
        }

        return Task.CompletedTask;
    }


    /// <inheritdoc />
}
