using ArchLucid.Application.InfraEvidence.Mermaid;
using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Time.Testing;

namespace ArchLucid.Application.Tests.Analysis;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class SecureNowProjectionReuseObserverTests
{
    [Fact]
    public void Only_successful_complete_in_scope_large_captures_are_observed()
    {
        var log = new RecordingLogger { Enabled = false };
        var observer = new SecureNowProjectionReuseObserver(new FakeTimeProvider(), log);
        var (scope, snapshot) = Fixture();

        Assert.Null(observer.Start(snapshot, scope, snapshot.Header.SnapshotId));
        log.Enabled = true;
        Assert.NotNull(observer.Start(snapshot, scope, snapshot.Header.SnapshotId));
        Assert.Null(observer.Start(snapshot, scope, Guid.NewGuid()));
        Assert.Null(observer.Start(snapshot, new ScopeContext
        {
            TenantId = scope.TenantId, WorkspaceId = scope.WorkspaceId, ProjectId = Guid.NewGuid(),
        }, snapshot.Header.SnapshotId));
        Assert.Null(observer.Start(new AzureInventorySnapshotDetailReadModel { Header = snapshot.Header },
            scope, snapshot.Header.SnapshotId));
        Assert.Empty(log.Events);
    }

    [Fact]
    public void Unavailable_diagnostics_do_not_interrupt_the_projection()
    {
        var log = new RecordingLogger { ThrowOnEnablement = true };
        var observer = new SecureNowProjectionReuseObserver(new FakeTimeProvider(), log);
        var (scope, snapshot) = Fixture();

        Assert.Null(observer.Start(snapshot, scope, snapshot.Header.SnapshotId));
    }

    [Fact]
    public void Cohort_counts_only_exact_nonoverlapping_repeats_and_exports_no_scope_identifiers()
    {
        var clock = new FakeTimeProvider();
        var log = new RecordingLogger();
        var observer = new SecureNowProjectionReuseObserver(clock, log);
        var (scope, snapshot) = Fixture();
        GraphSnapshot graph = Projection(snapshot.Header.SnapshotId);
        long first = observer.Start(snapshot, scope, snapshot.Header.SnapshotId)!.Value;

        clock.Advance(TimeSpan.FromMilliseconds(5));
        observer.Record(snapshot.Header, graph, first, false, false);
        observer.Record(snapshot.Header, graph, first, false, false); // Already started when the first finished.

        long repeat = observer.Start(snapshot, scope, snapshot.Header.SnapshotId)!.Value;
        clock.Advance(TimeSpan.FromMilliseconds(1));
        observer.Record(snapshot.Header, graph, repeat, false, false);
        observer.Record(snapshot.Header, graph, repeat, true, false); // A different projection mode.
        GraphSnapshot different = Projection(snapshot.Header.SnapshotId);
        different.Nodes[0].Label = "different output";
        observer.Record(snapshot.Header, different, repeat, false, false);

        Assert.Empty(log.Events);
        clock.Advance(TimeSpan.FromHours(1));
        observer.Record(snapshot.Header, graph, clock.GetTimestamp(), false, false);

        Assert.Equal(3, log.Events.Count);
        Assert.All(log.Events, e =>
        {
            Assert.Equal(8505, e.Id);
            Assert.DoesNotContain(snapshot.Header.SnapshotId.ToString(), e.Message);
            Assert.DoesNotContain(scope.TenantId.ToString(), e.Message);
            Assert.DoesNotContain(scope.WorkspaceId.ToString(), e.Message);
            Assert.DoesNotContain(scope.ProjectId.ToString(), e.Message);
        });
        Assert.Single(log.Events, e => e.Message.Contains("Repeats=1", StringComparison.Ordinal));
        Assert.Equal(2, log.Events.Count(e => e.Message.Contains("Repeats=0", StringComparison.Ordinal)));
    }

    [Fact]
    public void Capacity_drops_new_cohorts_without_evicting_old_observations_early()
    {
        var clock = new FakeTimeProvider();
        var log = new RecordingLogger();
        var observer = new SecureNowProjectionReuseObserver(clock, log);

        for (int i = 0; i <= SecureNowProjectionReuseObserver.Capacity; i++)
        {
            var (_, snapshot) = Fixture();
            observer.Record(snapshot.Header, Projection(snapshot.Header.SnapshotId), clock.GetTimestamp(), false, false);
        }

        var dropped = Assert.Single(log.Events);
        Assert.Equal(8506, dropped.Id);
        Assert.Contains("capacity", dropped.Message);
    }

    private static (ScopeContext, AzureInventorySnapshotDetailReadModel) Fixture()
    {
        ScopeContext scope = new()
        {
            TenantId = Guid.NewGuid(), WorkspaceId = Guid.NewGuid(), ProjectId = Guid.NewGuid(),
        };
        return (scope, new AzureInventorySnapshotDetailReadModel
        {
            Header = new AzureInventorySnapshotRecord
            {
                SnapshotId = Guid.NewGuid(), TenantId = scope.TenantId,
                WorkspaceId = scope.WorkspaceId, ProjectId = scope.ProjectId,
                CaptureStatus = AzureInventoryCaptureStatus.Succeeded,
                ContentHashSha256 = new byte[32], CompletenessScore = 1,
            },
            Resources = Enumerable.Repeat(new AzureInventoryResourceRecord(), 2048).ToArray(),
        });
    }

    private static GraphSnapshot Projection(Guid snapshotId) => new()
    {
        GraphSnapshotId = snapshotId,
        Nodes = Enumerable.Range(0, 2048).Select(i => new GraphNode { NodeId = $"component-{i}" }).ToList(),
    };

    private sealed class RecordingLogger : ILogger<SecureNowProjectionReuseObserver>
    {
        public bool Enabled { get; set; } = true;
        public bool ThrowOnEnablement { get; set; }
        public List<(int Id, string Message)> Events { get; } = [];
        public IDisposable? BeginScope<TState>(TState state) where TState : notnull => null;
        public bool IsEnabled(LogLevel logLevel) => ThrowOnEnablement
            ? throw new InvalidOperationException("Synthetic telemetry failure.")
            : Enabled;
        public void Log<TState>(LogLevel logLevel, EventId eventId, TState state, Exception? exception,
            Func<TState, Exception?, string> formatter) => Events.Add((eventId.Id, formatter(state, exception)));
    }
}
