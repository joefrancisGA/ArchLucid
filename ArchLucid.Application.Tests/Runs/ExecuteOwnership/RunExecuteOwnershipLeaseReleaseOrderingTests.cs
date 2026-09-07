using ArchLucid.Application.Runs.ExecuteOwnership;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Hosting;
using ArchLucid.Core.Persistence.ApplicationPorts.Interfaces;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Application.Tests.Runs.ExecuteOwnership;

/// <summary>TB-943: release/renew ordering around orchestrator execute completion.</summary>
[Trait("Category", "Unit")]
[Trait("Suite", "RunExecuteOwnership")]
public sealed class RunExecuteOwnershipLeaseReleaseOrderingTests
{
    [Fact]
    public async Task Execute_completion_pattern_does_not_recreate_lease_when_renewal_runs_after_release()
    {
        Guid runId = Guid.NewGuid();
        InMemoryRunExecuteOwnershipLeaseRepository repository = new();
        RunExecuteOwnershipLeaseService service = CreateService(repository, "instance-a");

        await service.AcquireAsync(runId, CancellationToken.None);

        IAsyncDisposable renewalScope = service.BeginRenewalScope(runId, CancellationToken.None);

        try
        {
            await Task.CompletedTask;
        }
        finally
        {
            await renewalScope.DisposeAsync();
            await service.ReleaseAsync(runId, CancellationToken.None);
        }

        repository.IsHeldBy(runId, "instance-a").Should().BeFalse(
            "cancelling renewal before release must leave no execute ownership lease row");
    }

    [Fact]
    public async Task Release_before_renewal_scope_dispose_allows_renew_to_recreate_lease()
    {
        Guid runId = Guid.NewGuid();
        InMemoryRunExecuteOwnershipLeaseRepository repository = new();
        RunExecuteOwnershipLeaseService service = CreateService(repository, "instance-a");

        await service.AcquireAsync(runId, CancellationToken.None);

        IAsyncDisposable renewalScope = service.BeginRenewalScope(runId, CancellationToken.None);

        try
        {
            await Task.CompletedTask;
        }
        finally
        {
            await service.ReleaseAsync(runId, CancellationToken.None);
            await renewalScope.DisposeAsync();
        }

        await service.RenewAsync(runId, CancellationToken.None);

        repository.IsHeldBy(runId, "instance-a").Should().BeTrue(
            "release before renewal cancellation leaves a window where heartbeat renew recreates the lease");
    }

    private static RunExecuteOwnershipLeaseService CreateService(
        IRunExecuteOwnershipLeaseRepository repository,
        string instanceId)
    {
        Mock<IHostProcessInstanceId> instance = new();
        instance.Setup(i => i.Value).Returns(instanceId);

        Mock<IArchLucidStorageMode> storage = new();
        storage.Setup(s => s.IsInMemory).Returns(false);

        Mock<IOptionsMonitor<RunExecuteOwnershipLeaseOptions>> options = new();
        options.Setup(o => o.CurrentValue).Returns(new RunExecuteOwnershipLeaseOptions
        {
            Enabled = true,
            LeaseDurationSeconds = 900,
            HeartbeatRenewIntervalSeconds = 300,
        });

        return new RunExecuteOwnershipLeaseService(
            repository,
            instance.Object,
            storage.Object,
            new WorkerHostDrainGate(),
            options.Object,
            NullLogger<RunExecuteOwnershipLeaseService>.Instance);
    }

    private sealed class InMemoryRunExecuteOwnershipLeaseRepository : IRunExecuteOwnershipLeaseRepository
    {
        private readonly Dictionary<Guid, LeaseRow> _leases = new();

        public bool IsHeldBy(Guid runId, string holderInstanceId)
        {
            if (!_leases.TryGetValue(runId, out LeaseRow? row))
                return false;

            return string.Equals(row.HolderInstanceId, holderInstanceId, StringComparison.Ordinal)
                && row.LeaseExpiresUtc > TimeProvider.System.GetUtcNow();
        }

        public Task<bool> TryAcquireOrRenewAsync(
            Guid runId,
            string holderInstanceId,
            int leaseDurationSeconds,
            CancellationToken cancellationToken = default)
        {
            DateTimeOffset nowUtc = TimeProvider.System.GetUtcNow();
            DateTimeOffset newExpiryUtc = nowUtc.AddSeconds(leaseDurationSeconds);

            if (!_leases.TryGetValue(runId, out LeaseRow? row)
                || row.LeaseExpiresUtc < nowUtc
                || string.Equals(row.HolderInstanceId, holderInstanceId, StringComparison.Ordinal))
            {
                _leases[runId] = new LeaseRow(holderInstanceId, newExpiryUtc);

                return Task.FromResult(true);
            }

            return Task.FromResult(false);
        }

        public Task TryReleaseAsync(Guid runId, string holderInstanceId, CancellationToken cancellationToken = default)
        {
            if (_leases.TryGetValue(runId, out LeaseRow? row)
                && string.Equals(row.HolderInstanceId, holderInstanceId, StringComparison.Ordinal))
            {
                _leases.Remove(runId);
            }

            return Task.CompletedTask;
        }

        public Task<int> ReleaseAllHeldByInstanceAsync(string holderInstanceId, CancellationToken cancellationToken = default)
        {
            List<Guid> held = _leases
                .Where(pair => string.Equals(pair.Value.HolderInstanceId, holderInstanceId, StringComparison.Ordinal))
                .Select(pair => pair.Key)
                .ToList();

            foreach (Guid runId in held)
            {
                _leases.Remove(runId);
            }

            return Task.FromResult(held.Count);
        }

        public Task<IReadOnlyList<Guid>> ListExpiredRunIdsAsync(
            DateTimeOffset asOfUtc,
            int maxRows,
            CancellationToken cancellationToken = default)
        {
            IReadOnlyList<Guid> expired = _leases
                .Where(pair => pair.Value.LeaseExpiresUtc < asOfUtc)
                .OrderBy(pair => pair.Value.LeaseExpiresUtc)
                .Take(maxRows)
                .Select(pair => pair.Key)
                .ToList();

            return Task.FromResult(expired);
        }

        public Task TryDeleteAsync(Guid runId, CancellationToken cancellationToken = default)
        {
            _leases.Remove(runId);

            return Task.CompletedTask;
        }

        private sealed record LeaseRow(string HolderInstanceId, DateTimeOffset LeaseExpiresUtc);
    }
}
