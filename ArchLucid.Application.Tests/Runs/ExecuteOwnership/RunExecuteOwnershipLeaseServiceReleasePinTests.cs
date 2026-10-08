using ArchLucid.Application.Runs.ExecuteOwnership;
using ArchLucid.Contracts.Common;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Hosting;
using ArchLucid.Core.Persistence.ApplicationPorts.Interfaces;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Application.Tests.Runs.ExecuteOwnership;

[Trait("Category", "Unit")]
[Trait("Suite", "RunExecuteOwnership")]
public sealed class RunExecuteOwnershipLeaseServiceReleasePinTests
{
    [Fact]
    public async Task ReleaseAsync_clears_local_pin_when_sql_holder_no_longer_matches_pinned_holder()
    {
        Guid runId = Guid.NewGuid();
        HolderTrackingLeaseRepository repository = new();
        RunExecuteOwnershipLeaseService sut = CreateSut(repository);

        await sut.AcquireAsync(runId, CancellationToken.None);

        repository.ReassignHolder(runId, "peer-b");

        await sut.ReleaseAsync(runId, CancellationToken.None);

        repository.IsHeldBy(runId, "peer-b").Should().BeTrue(
            "TryReleaseAsync is conditional on the pinned holder id and does not delete a reconciled peer row");

        Func<Task> secondAcquire = () => sut.AcquireAsync(runId, CancellationToken.None);

        await secondAcquire.Should().ThrowAsync<ConflictException>()
            .WithMessage("*already owned by another host instance*");
    }

    private static RunExecuteOwnershipLeaseService CreateSut(IRunExecuteOwnershipLeaseRepository repository)
    {
        Mock<IHostProcessInstanceId> instance = new();
        instance.Setup(i => i.Value).Returns("instance-a");

        Mock<IArchLucidStorageMode> storage = new();
        storage.Setup(s => s.IsInMemory).Returns(false);

        Mock<IOptionsMonitor<RunExecuteOwnershipLeaseOptions>> optionsMonitor = new();
        optionsMonitor.Setup(o => o.CurrentValue).Returns(new RunExecuteOwnershipLeaseOptions { Enabled = true });

        return new RunExecuteOwnershipLeaseService(
            repository,
            instance.Object,
            storage.Object,
            new WorkerHostDrainGate(),
            optionsMonitor.Object,
            NullLogger<RunExecuteOwnershipLeaseService>.Instance,
            new RunExecuteOwnershipActiveHolderRegistry());
    }

    private sealed class HolderTrackingLeaseRepository : IRunExecuteOwnershipLeaseRepository
    {
        private readonly Dictionary<Guid, LeaseRow> _leases = new();

        public bool IsHeldBy(Guid runId, string holderInstanceId)
        {
            if (!_leases.TryGetValue(runId, out LeaseRow? row))
                return false;

            return string.Equals(row.HolderInstanceId, holderInstanceId, StringComparison.Ordinal)
                && row.LeaseExpiresUtc > DateTimeOffset.UtcNow;
        }

        public void ReassignHolder(Guid runId, string holderInstanceId)
        {
            if (!_leases.TryGetValue(runId, out LeaseRow? row))
                return;

            _leases[runId] = row with { HolderInstanceId = holderInstanceId };
        }

        public Task<bool> TryAcquireOrRenewAsync(
            Guid runId,
            string holderInstanceId,
            int leaseDurationSeconds,
            CancellationToken cancellationToken = default)
        {
            DateTimeOffset nowUtc = DateTimeOffset.UtcNow;
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
            CancellationToken cancellationToken = default) =>
            Task.FromResult<IReadOnlyList<Guid>>(Array.Empty<Guid>());

        public Task TryDeleteAsync(Guid runId, CancellationToken cancellationToken = default)
        {
            _leases.Remove(runId);

            return Task.CompletedTask;
        }

        private sealed record LeaseRow(string HolderInstanceId, DateTimeOffset LeaseExpiresUtc);
    }
}
