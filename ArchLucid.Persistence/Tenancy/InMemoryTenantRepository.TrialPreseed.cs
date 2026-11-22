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
        ct.ThrowIfCancellationRequested();

        lock (_trialGate)
        {
            if (!_byId.TryGetValue(tenantId, out TenantRecord? existing) || existing.TrialWelcomeRunId is not null || existing.TrialArchitecturePreseedEnqueuedUtc is not null)
                return Task.CompletedTask;

            _byId[tenantId] = TenantRepositoryCore.CopyTenant(existing, trialArchitecturePreseedEnqueuedUtc: TimeProvider.System.GetUtcNow());
        }

        return Task.CompletedTask;
    }


    /// <inheritdoc />
    public Task<IReadOnlyList<Guid>> ListTenantIdsPendingTrialArchitecturePreseedAsync(int take, CancellationToken ct)
    {
        ct.ThrowIfCancellationRequested();

        lock (_trialGate)
        {
            List<Guid> ids = _byId.Values
                .Where(static t =>
                    t.TrialArchitecturePreseedEnqueuedUtc is not null
                    && t.TrialWelcomeRunId is null
                    && t.TrialArchitecturePreseedFailedUtc is null
                    && t.TrialArchitecturePreseedAttemptCount < 5
                    && TrialLifecycleStatus.EqualsStatus(t.TrialStatus, TrialLifecycleStatus.Active))
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
        ct.ThrowIfCancellationRequested();

        lock (_trialGate)
        {
            if (!_byId.TryGetValue(tenantId, out TenantRecord? existing) || existing.TrialWelcomeRunId is not null)
                return Task.CompletedTask;

            _byId[tenantId] = TenantRepositoryCore.CopyTenant(existing, trialWelcomeRunId: welcomeRunId);
        }

        return Task.CompletedTask;
    }


    /// <inheritdoc />
    public Task<int> IncrementTrialArchitecturePreseedAttemptAsync(Guid tenantId, string lastError, CancellationToken ct)
    {
        ct.ThrowIfCancellationRequested();

        lock (_trialGate)
        {
            if (!_byId.TryGetValue(tenantId, out TenantRecord? existing))
                return Task.FromResult(0);

            int nextAttempt = existing.TrialArchitecturePreseedAttemptCount + 1;
            DateTimeOffset? failedUtc = nextAttempt >= 5 ? TimeProvider.System.GetUtcNow() : existing.TrialArchitecturePreseedFailedUtc;

            // Match the SQL repository's bounded error column: normalize whitespace
            // and truncate before writing to avoid incompatible retry telemetry.
            string normalizedError = string.IsNullOrWhiteSpace(lastError) ? "unknown" : lastError.Trim();
            if (normalizedError.Length > 2048)
                normalizedError = normalizedError[..2048];

            _byId[tenantId] = TenantRepositoryCore.CopyTenant(
                existing,
                trialArchitecturePreseedAttemptCount: nextAttempt,
                trialArchitecturePreseedFailedUtc: failedUtc,
                trialArchitecturePreseedLastError: normalizedError);

            return Task.FromResult(nextAttempt);
        }
    }
}
