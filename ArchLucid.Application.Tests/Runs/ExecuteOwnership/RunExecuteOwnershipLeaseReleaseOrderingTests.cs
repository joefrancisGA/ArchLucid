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

        IAsyncDisposable renewalScope = service.BeginRenewalScope(runId, new CancellationTokenSource());

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
    public async Task ReleaseAsync_when_process_instance_id_rotates_after_acquire_releases_original_holder()
    {
        Guid runId = Guid.NewGuid();
        InMemoryRunExecuteOwnershipLeaseRepository repository = new();
        string currentInstanceId = "instance-a";
        Mock<IHostProcessInstanceId> instance = new();
        instance.Setup(i => i.Value).Returns(() => currentInstanceId);

        RunExecuteOwnershipLeaseService service = CreateService(repository, instance);

        await service.AcquireAsync(runId, CancellationToken.None);
        repository.IsHeldBy(runId, "instance-a").Should().BeTrue();

        currentInstanceId = "instance-b";
        await service.ReleaseAsync(runId, CancellationToken.None);

        repository.IsHeldBy(runId, "instance-a").Should().BeFalse(
            "release must target the holder instance id used at acquire time, not the rotated process identity");
    }

    [Fact]
    public async Task ReleaseAsync_when_repository_throws_and_process_instance_rotates_retry_still_targets_original_holder()
    {
        Guid runId = Guid.NewGuid();
        string currentInstanceId = "instance-a";
        Mock<IHostProcessInstanceId> instance = new();
        instance.Setup(i => i.Value).Returns(() => currentInstanceId);

        int releaseAttempts = 0;
        Mock<IRunExecuteOwnershipLeaseRepository> leases = new();
        leases
            .Setup(l => l.TryAcquireOrRenewAsync(runId, "instance-a", 900, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);
        leases
            .Setup(l => l.TryReleaseAsync(runId, It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .Returns<Guid, string, CancellationToken>((_, holder, _) =>
            {
                releaseAttempts++;

                if (releaseAttempts == 1)
                    throw new InvalidOperationException("simulated transient release failure");

                if (!string.Equals(holder, "instance-a", StringComparison.Ordinal))
                    throw new InvalidOperationException($"release retried with wrong holder '{holder}'.");

                return Task.CompletedTask;
            });

        RunExecuteOwnershipLeaseService service = CreateService(leases.Object, instance);

        await service.AcquireAsync(runId, CancellationToken.None);
        currentInstanceId = "instance-b";

        Func<Task> firstRelease = () => service.ReleaseAsync(runId, CancellationToken.None);
        await firstRelease.Should().ThrowAsync<InvalidOperationException>();

        await service.ReleaseAsync(runId, CancellationToken.None);

        releaseAttempts.Should().Be(2);
    }

    [Fact]
    public async Task Release_before_renewal_scope_dispose_allows_renew_to_recreate_lease()
    {
        Guid runId = Guid.NewGuid();
        InMemoryRunExecuteOwnershipLeaseRepository repository = new();
        RunExecuteOwnershipLeaseService service = CreateService(repository, "instance-a");

        await service.AcquireAsync(runId, CancellationToken.None);

        IAsyncDisposable renewalScope = service.BeginRenewalScope(runId, new CancellationTokenSource());

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
        string instanceId) =>
        CreateService(repository, CreateInstanceMock(instanceId));

    private static Mock<IHostProcessInstanceId> CreateInstanceMock(string instanceId)
    {
        Mock<IHostProcessInstanceId> instance = new();
        instance.Setup(i => i.Value).Returns(instanceId);
        return instance;
    }

    private static RunExecuteOwnershipLeaseService CreateService(
        IRunExecuteOwnershipLeaseRepository repository,
        Mock<IHostProcessInstanceId> instance)
    {

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
            NullLogger<RunExecuteOwnershipLeaseService>.Instance,
            new RunExecuteOwnershipActiveHolderRegistry());
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
