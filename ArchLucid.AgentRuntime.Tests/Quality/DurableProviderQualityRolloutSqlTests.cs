using System.Collections.Concurrent;
using System.Diagnostics;

using ArchLucid.AgentRuntime.Quality;
using ArchLucid.Persistence.Connections;
using ArchLucid.Persistence.Data.Infrastructure;
using ArchLucid.Persistence.Resilience;
using ArchLucid.TestSupport;

using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Options;

using Xunit.Abstractions;

namespace ArchLucid.AgentRuntime.Tests.Quality;

[Trait("Category", "SqlServerContainer")]
[Trait("Category", "Integration")]
public sealed class DurableProviderQualityRolloutSqlTests(ITestOutputHelper output)
{
    [SkippableFact]
    public Task Synthetic_replay_requires_fresh_evidence_after_verified_recovery_across_replicas() =>
        WithDisposableCatalogAsync(ReplayAsync);

    [SkippableFact]
    public Task Default_thresholds_measure_false_quarantines_and_latency_under_mixed_load() =>
        WithDisposableCatalogAsync(MeasureMixedCohortAsync);

    private static async Task WithDisposableCatalogAsync(Func<string, Task> replay)
    {
        Skip.If(
            !OperatingSystem.IsWindows()
            && string.IsNullOrWhiteSpace(Environment.GetEnvironmentVariable(TestDatabaseEnvironment.ApiIntegrationSqlEnvironmentVariable))
            && string.IsNullOrWhiteSpace(Environment.GetEnvironmentVariable(TestDatabaseEnvironment.PersistenceSqlEnvironmentVariable)),
            "A disposable SQL Server instance is required.");

        string catalog = "ArchLucidQualityRollout" + Guid.NewGuid().ToString("N");
        string connectionString = SqlServerIntegrationTestConnections.CreateEphemeralApiDatabaseConnectionString(catalog);
        string server = new SqlConnectionStringBuilder(connectionString).DataSource;
        Skip.If(!string.Equals(server, "127.0.0.1,1433", StringComparison.Ordinal),
            "The replay only runs against the loopback SQL Server fixture.");

        SqlServerTestCatalogCommands.EnsureCatalogExists(connectionString);
        try
        {
            DatabaseMigrator.RunSystem(connectionString);
            await replay(connectionString);
        }
        finally
        {
            SqlServerTestCatalogCommands.DropCatalogIfExists(connectionString);
        }
    }

    private async Task MeasureMixedCohortAsync(string connectionString)
    {
        const int healthyCohorts = 24;
        const int degradedCohorts = 8;
        const int observationsPerCohort = 64;
        using CancellationTokenSource timeout = new(TimeSpan.FromSeconds(120));
        ManualClock clock = new();
        DedicatedSystemSqlConnectionFactory sql = new(connectionString);
        IOptions<ProviderQualityOptions> options = Options.Create(new ProviderQualityOptions());
        DurableProviderQualityMonitor writer = new(options, new SqlProviderQualityStateStore(sql), clock);
        DurableProviderQualityMonitor reader = new(options, new SqlProviderQualityStateStore(sql), clock);
        ConcurrentBag<double> updateLatency = [];
        ConcurrentBag<double> admissionLatency = [];
        ConcurrentBag<int> healthyTrips = [];
        ConcurrentBag<int> degradedTrips = [];

        // Warm the pool and serialization before timing.
        await reader.AdmitAsync("azure-openai", "warmup-only", timeout.Token);
        await Parallel.ForEachAsync(Enumerable.Range(0, healthyCohorts + degradedCohorts),
            new ParallelOptions { MaxDegreeOfParallelism = 4, CancellationToken = timeout.Token },
            async (cohort, ct) =>
            {
                bool healthy = cohort < healthyCohorts;
                ProviderQualityKey key = ProviderQualityKey.Create("azure-openai", $"replay-{cohort}", "v1");
                bool tripped = false;

                for (int i = 0; i < observationsPerCohort; i++)
                {
                    // Stagger sparse high-severity contradictions and unverified evidence across healthy fixtures.
                    int phase = (i + cohort * 7) % observationsPerCohort;
                    ProviderQualityLabel label = phase % 8 == 7 ? ProviderQualityLabel.Unknown
                        : (healthy ? phase is 12 or 29 : phase % 4 != 0)
                            ? ProviderQualityLabel.Contradicted : ProviderQualityLabel.Supported;
                    long started = Stopwatch.GetTimestamp();
                    ProviderQualityRecordResult recorded = await writer.RecordAsync(
                        Sample(key, $"case-{i}", label, clock), ct);
                    updateLatency.Add(Stopwatch.GetElapsedTime(started).TotalMilliseconds);

                    started = Stopwatch.GetTimestamp();
                    ProviderQualityAdmission admission = await reader.AdmitAsync(key.ProviderId, key.ModelId, ct);
                    admissionLatency.Add(Stopwatch.GetElapsedTime(started).TotalMilliseconds);
                    tripped |= recorded.Snapshot.Quarantined || !admission.Allowed;
                }

                if (tripped)
                {
                    if (healthy)
                        healthyTrips.Add(cohort);
                    else
                        degradedTrips.Add(cohort);
                }
            });

        output.WriteLine(FormattableString.Invariant(
            $"FND073_REPLAY healthy_false_quarantines={healthyTrips.Count}/{healthyCohorts} degraded_detected={degradedTrips.Count}/{degradedCohorts} observations={updateLatency.Count} concurrency=4 sql_update_p50_ms={Percentile(updateLatency, .50):F2} sql_update_p95_ms={Percentile(updateLatency, .95):F2} sql_admit_p50_ms={Percentile(admissionLatency, .50):F2} sql_admit_p95_ms={Percentile(admissionLatency, .95):F2}"));
        Assert.Empty(healthyTrips);
        Assert.Equal(degradedCohorts, degradedTrips.Count);
        Assert.Equal((healthyCohorts + degradedCohorts) * observationsPerCohort, updateLatency.Count);
        Assert.Equal(updateLatency.Count, admissionLatency.Count);
    }

    private static double Percentile(IEnumerable<double> samples, double fraction)
    {
        double[] ordered = samples.Order().ToArray();
        return ordered[(int)Math.Ceiling(ordered.Length * fraction) - 1];
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
