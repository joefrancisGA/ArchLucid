using System.Collections.Concurrent;
using System.Data;

using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;

using JetBrains.Annotations;

namespace ArchLucid.Persistence.Tenancy;

public sealed partial class InMemoryTenantRepository
{
    public Task EnqueueTrialArchitecturePreseedAsync(Guid tenantId, CancellationToken ct)
    {
        _ = ct;

        lock (_trialGate)
        {
            if (!_byId.TryGetValue(tenantId, out TenantRecord? existing) || existing.TrialWelcomeRunId is not null || existing.TrialArchitecturePreseedEnqueuedUtc is not null)
                return Task.CompletedTask;

            _byId[tenantId] = CopyTenant(existing, trialArchitecturePreseedEnqueuedUtc: TimeProvider.System.GetUtcNow());
        }

        return Task.CompletedTask;
    }


    /// <inheritdoc />
    public Task<IReadOnlyList<Guid>> ListTenantIdsPendingTrialArchitecturePreseedAsync(int take, CancellationToken ct)
    {
        _ = ct;

        lock (_trialGate)
        {
            List<Guid> ids = _byId.Values
                .Where(static t =>
                    t.TrialArchitecturePreseedEnqueuedUtc is not null
                    && t.TrialWelcomeRunId is null
                    && t.TrialArchitecturePreseedFailedUtc is null
                    && t.TrialArchitecturePreseedAttemptCount < 5
                    && string.Equals(t.TrialStatus, TrialLifecycleStatus.Active, StringComparison.Ordinal))
                .OrderBy(static t => t.TrialArchitecturePreseedEnqueuedUtc)
                .Take(Math.Clamp(take, 1, 50))
                .Select(static t => t.Id)
                .ToList();

            return Task.FromResult<IReadOnlyList<Guid>>(ids);
        }
    }


    /// <inheritdoc />
    public Task MarkTrialArchitecturePreseedCompletedAsync(Guid tenantId, Guid welcomeRunId, CancellationToken ct)
    {
        _ = ct;

        lock (_trialGate)
        {
            if (!_byId.TryGetValue(tenantId, out TenantRecord? existing) || existing.TrialWelcomeRunId is not null)
                return Task.CompletedTask;

            _byId[tenantId] = CopyTenant(existing, trialWelcomeRunId: welcomeRunId);
        }

        return Task.CompletedTask;
    }


    /// <inheritdoc />
    public Task<int> IncrementTrialArchitecturePreseedAttemptAsync(Guid tenantId, string lastError, CancellationToken ct)
    {
        _ = ct;

        lock (_trialGate)
        {
            if (!_byId.TryGetValue(tenantId, out TenantRecord? existing))
                return Task.FromResult(0);

            int nextAttempt = existing.TrialArchitecturePreseedAttemptCount + 1;
            DateTimeOffset? failedUtc = nextAttempt >= 5 ? TimeProvider.System.GetUtcNow() : existing.TrialArchitecturePreseedFailedUtc;

            _byId[tenantId] = CopyTenant(
                existing,
                trialArchitecturePreseedAttemptCount: nextAttempt,
                trialArchitecturePreseedFailedUtc: failedUtc,
                trialArchitecturePreseedLastError: lastError);

            return Task.FromResult(nextAttempt);
        }
    }
}
