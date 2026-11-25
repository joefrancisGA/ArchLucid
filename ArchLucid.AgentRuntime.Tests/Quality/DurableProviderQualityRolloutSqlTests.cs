using ArchLucid.AgentRuntime.Quality;
using ArchLucid.Persistence.Connections;
using ArchLucid.Persistence.Data.Infrastructure;
using ArchLucid.Persistence.Resilience;
using ArchLucid.TestSupport;

using Microsoft.Extensions.Options;

namespace ArchLucid.AgentRuntime.Tests.Quality;

[Trait("Category", "SqlServerContainer")]
[Trait("Category", "Integration")]
public sealed class DurableProviderQualityRolloutSqlTests
{
    [SkippableFact]
    public async Task Synthetic_replay_requires_fresh_evidence_after_verified_recovery_across_replicas()
    {
        Skip.If(
            !OperatingSystem.IsWindows()
            && string.IsNullOrWhiteSpace(Environment.GetEnvironmentVariable(TestDatabaseEnvironment.ApiIntegrationSqlEnvironmentVariable))
            && string.IsNullOrWhiteSpace(Environment.GetEnvironmentVariable(TestDatabaseEnvironment.PersistenceSqlEnvironmentVariable)),
            "A disposable SQL Server instance is required.");

        string catalog = "ArchLucidQualityRollout" + Guid.NewGuid().ToString("N");
        string connectionString = SqlServerIntegrationTestConnections.CreateEphemeralApiDatabaseConnectionString(catalog);
        SqlServerTestCatalogCommands.EnsureCatalogExists(connectionString);
        try
        {
            DatabaseMigrator.RunSystem(connectionString);
            await ReplayAsync(connectionString);
        }
        finally
        {
            SqlServerTestCatalogCommands.DropCatalogIfExists(connectionString);
        }
    }

    private static async Task ReplayAsync(string connectionString)
    {
        using CancellationTokenSource timeout = new(TimeSpan.FromSeconds(60));
        CancellationToken ct = timeout.Token;
        ManualClock clock = new();
        DurableProviderQualityMonitor writer = CreateMonitor(connectionString, clock);
        DurableProviderQualityMonitor replica = CreateMonitor(connectionString, clock);
        ProviderQualityKey control = ProviderQualityKey.Create("azure-openai", "healthy-control", "v1");
        ProviderQualityKey degraded = ProviderQualityKey.Create("azure-openai", "degraded-control", "v1");

        for (int i = 0; i < 32; i++)
        {
            ProviderQualityLabel label = i % 8 == 7 ? ProviderQualityLabel.Unknown
                : i is 16 or 24 ? ProviderQualityLabel.Contradicted
                : ProviderQualityLabel.Supported;
            ProviderQualityRecordResult controlResult = await writer.RecordAsync(
                Sample(control, $"control-{i}", label, clock), ct);
            Assert.False(controlResult.Snapshot.Quarantined);
        }

        for (int i = 0; i < 5; i++)
            await writer.RecordAsync(Sample(degraded, $"pre-recovery-{i}", ProviderQualityLabel.Contradicted, clock), ct);

        Assert.True((await replica.AdmitAsync(control.ProviderId, control.ModelId, ct)).Allowed);
        Assert.False((await replica.AdmitAsync(degraded.ProviderId, degraded.ModelId, ct)).Allowed);

        clock.Advance(TimeSpan.FromSeconds(31));
        ProviderQualityAdmission lease = await replica.AdmitAsync(degraded.ProviderId, degraded.ModelId, ct);
        Assert.True(lease.RecoveryProbe);
        Guid leaseId = Assert.IsType<Guid>(lease.RecoveryLeaseId);
        await writer.BindRecoveryTraceAsync(degraded, leaseId, "exact-recovery", ct);

        ProviderQualityRecordResult unrelated = await replica.RecordAsync(
            Sample(degraded, "unrelated", ProviderQualityLabel.Supported, clock) with { TraceId = "other" }, ct);
        Assert.True(unrelated.Snapshot.Quarantined);
        ProviderQualityRecordResult recovered = await replica.RecordAsync(
            Sample(degraded, "recovery", ProviderQualityLabel.Supported, clock) with { TraceId = "exact-recovery" }, ct);
        Assert.Equal("recovered", recovered.Transition);
        Assert.Equal(7, recovered.Snapshot.KnownSampleCount);
        Assert.Equal(0, recovered.Snapshot.DecisionWindowKnownSamples);

        DurableProviderQualityMonitor restarted = CreateMonitor(connectionString, clock);
        ProviderQualityRecordResult freshHealthy = await restarted.RecordAsync(
            Sample(degraded, "fresh-healthy", ProviderQualityLabel.Supported, clock), ct);
        Assert.False(freshHealthy.Snapshot.Quarantined);
        Assert.Equal(5, freshHealthy.Snapshot.BadSampleCount);
        Assert.Equal(1, freshHealthy.Snapshot.DecisionWindowKnownSamples);

        // Historical samples remain deduplicated and cannot count toward a fresh trip.
        ProviderQualityRecordResult replayed = await writer.RecordAsync(
            Sample(degraded, "pre-recovery-0", ProviderQualityLabel.Contradicted, clock), ct);
        Assert.Equal(1, replayed.Snapshot.DecisionWindowKnownSamples);
        Assert.False(replayed.Snapshot.Quarantined);

        for (int i = 0; i < 4; i++)
        {
            ProviderQualityRecordResult freshBad = await restarted.RecordAsync(
                Sample(degraded, $"fresh-bad-{i}", ProviderQualityLabel.Contradicted, clock), ct);
            Assert.Equal(i == 3, freshBad.Snapshot.Quarantined);
        }

        Assert.False((await replica.AdmitAsync(degraded.ProviderId, degraded.ModelId, ct)).Allowed);
        Assert.True((await replica.AdmitAsync(control.ProviderId, control.ModelId, ct)).Allowed);
    }

    private static DurableProviderQualityMonitor CreateMonitor(string connectionString, TimeProvider clock) =>
        new(
            Options.Create(new ProviderQualityOptions
            {
                MinimumIndependentKnownSamples = 5,
                QuarantineSeconds = 30,
            }),
            new SqlProviderQualityStateStore(new DedicatedSystemSqlConnectionFactory(connectionString)),
            clock);

    private static ProviderQualityAdjudication Sample(
        ProviderQualityKey key, string id, ProviderQualityLabel label, TimeProvider clock) =>
        new(id, key, label, label == ProviderQualityLabel.Contradicted ? 4 : 1,
            label != ProviderQualityLabel.Unknown, "offline-rollout-fixture", clock.GetUtcNow());

    private sealed class ManualClock : TimeProvider
    {
        private DateTimeOffset _now = DateTimeOffset.UnixEpoch;

        public override DateTimeOffset GetUtcNow() => _now;

        internal void Advance(TimeSpan interval) => _now += interval;
    }
}
