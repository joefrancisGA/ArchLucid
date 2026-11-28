using System.Collections.Concurrent;
using System.Diagnostics;

using ArchLucid.AgentRuntime.Quality;
using ArchLucid.Core.Agents;
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
        const int replicasPerProfile = 4;
        const int observationsPerCohort = 64;
        const double p95BudgetMs = 250;
        ReplayProfile[] profiles =
        [
            new("steady-supported", false, i => (i % 16) switch
            {
                12 => new(ProviderQualityLabel.Unknown, 1),
                15 => new(ProviderQualityLabel.Contradicted, 4),
                _ => new(ProviderQualityLabel.Supported, 1),
            }),
            new("coverage-limited", false, i => (i % 16) switch
            {
                15 => new(ProviderQualityLabel.Contradicted, 4),
                0 or 4 or 8 or 12 => new(ProviderQualityLabel.Supported, 1),
                _ => new(ProviderQualityLabel.Unknown, 1),
            }),
            new("mixed-known", false, i => (i % 16) switch
            {
                13 or 14 => new(ProviderQualityLabel.Unsupported, 1),
                15 => new(ProviderQualityLabel.Unknown, 1),
                _ => new(ProviderQualityLabel.Supported, 1),
            }),
            new("unknown-only", false, _ => new(ProviderQualityLabel.Unknown, 1)),
            new("sustained-contradiction", true, i =>
                new(i % 16 < 4 ? ProviderQualityLabel.Supported : ProviderQualityLabel.Contradicted,
                    i % 16 < 4 ? 1 : 4)),
            new("sustained-unsupported", true, i =>
                new(i % 16 < 4 ? ProviderQualityLabel.Supported : ProviderQualityLabel.Unsupported, 1)),
        ];
        int healthyCohorts = profiles.Count(static profile => !profile.Degraded) * replicasPerProfile;
        int degradedCohorts = profiles.Count(static profile => profile.Degraded) * replicasPerProfile;
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
        ConcurrentBag<CohortReplayResult> cohortResults = [];

        // These are deterministic policy-representative cases, not production telemetry. They exercise the
        // default thresholds with sparse contradictions, incomplete coverage, unknown-only evidence,
        // unsupported claims and sustained degradation without retaining customer prompts or outputs.
        await reader.AdmitAsync("azure-openai", "warmup-only", timeout.Token);
        await Parallel.ForEachAsync(Enumerable.Range(0, profiles.Length * replicasPerProfile),
            new ParallelOptions { MaxDegreeOfParallelism = 4, CancellationToken = timeout.Token },
            async (cohort, ct) =>
            {
                ReplayProfile profile = profiles[cohort % profiles.Length];
                ProviderQualityKey key = ProviderQualityKey.Create(
                    "azure-openai", $"replay-{profile.Name}-{cohort}", "v1");
                bool tripped = false;
                ProviderQualitySnapshot? finalSnapshot = null;

                for (int i = 0; i < observationsPerCohort; i++)
                {
                    ReplayObservation observation = profile.Observation(i + cohort * 5);
                    long started = Stopwatch.GetTimestamp();
                    ProviderQualityRecordResult recorded = await writer.RecordAsync(
                        Sample(key, $"case-{i}", observation.Label, clock, observation.SeverityWeight), ct);
                    updateLatency.Add(Stopwatch.GetElapsedTime(started).TotalMilliseconds);
                    finalSnapshot = recorded.Snapshot;

                    started = Stopwatch.GetTimestamp();
                    ProviderQualityAdmission admission = await reader.AdmitAsync(key.ProviderId, key.ModelId, ct);
                    admissionLatency.Add(Stopwatch.GetElapsedTime(started).TotalMilliseconds);
                    tripped |= recorded.Snapshot.Quarantined || !admission.Allowed;
                }

                ProviderQualitySnapshot snapshot = Assert.IsType<ProviderQualitySnapshot>(finalSnapshot);
                cohortResults.Add(new(profile.Name, profile.Degraded, tripped,
                    snapshot.KnownSampleCount, snapshot.UnknownSampleCount));

                if (tripped)
                {
                    if (profile.Degraded)
                        degradedTrips.Add(cohort);
                    else
                        healthyTrips.Add(cohort);
                }
            });

        Assert.Empty(healthyTrips);
        Assert.Equal(degradedCohorts, degradedTrips.Count);
        Assert.All(cohortResults.Where(static result => result.Profile == "unknown-only"), result =>
        {
            Assert.False(result.Tripped);
            Assert.Equal(0, result.Known);
            Assert.Equal(observationsPerCohort, result.Unknown);
        });
        Assert.All(cohortResults.Where(static result => result.Profile == "coverage-limited"), result =>
        {
            Assert.False(result.Tripped);
            Assert.Equal(20, result.Known);
            Assert.Equal(44, result.Unknown);
        });
        Assert.Equal((healthyCohorts + degradedCohorts) * observationsPerCohort, updateLatency.Count);
        Assert.Equal(updateLatency.Count, admissionLatency.Count);

        double updateP95 = Percentile(updateLatency, .95);
        double admissionP95 = Percentile(admissionLatency, .95);
        output.WriteLine(FormattableString.Invariant($"FND073_REPLAY coverage=offline-policy-scenarios coverage_limit=no-production-telemetry no_customer_data=true healthy_false_quarantines={healthyTrips.Count}/{healthyCohorts} degraded_detected={degradedTrips.Count}/{degradedCohorts} observations={updateLatency.Count} concurrency=4 sql_update_p50_ms={Percentile(updateLatency, .50):F2} sql_update_p95_ms={updateP95:F2} sql_admit_p50_ms={Percentile(admissionLatency, .50):F2} sql_admit_p95_ms={admissionP95:F2} sql_p95_budget_ms={p95BudgetMs:F0}"));
        Assert.True(updateP95 <= p95BudgetMs,
            $"SQL quality update p95 {updateP95:F2} ms exceeded the {p95BudgetMs:F0} ms offline replay budget.");
        Assert.True(admissionP95 <= p95BudgetMs,
            $"SQL admission p95 {admissionP95:F2} ms exceeded the {p95BudgetMs:F0} ms offline replay budget.");
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
        ProviderQualityKey key, string id, ProviderQualityLabel label, TimeProvider clock,
        int? severityWeight = null) =>
        new(id, key, label, severityWeight ?? (label == ProviderQualityLabel.Contradicted ? 4 : 1),
            label != ProviderQualityLabel.Unknown, "offline-rollout-fixture", clock.GetUtcNow());

    private sealed record ReplayProfile(
        string Name, bool Degraded, Func<int, ReplayObservation> Observation);

    private readonly record struct ReplayObservation(ProviderQualityLabel Label, int SeverityWeight);

    private sealed record CohortReplayResult(
        string Profile, bool Degraded, bool Tripped, int Known, int Unknown);

    private sealed class ManualClock : TimeProvider
    {
        private DateTimeOffset _now = DateTimeOffset.UnixEpoch;

        public override DateTimeOffset GetUtcNow() => _now;

        internal void Advance(TimeSpan interval) => _now += interval;
    }
}
