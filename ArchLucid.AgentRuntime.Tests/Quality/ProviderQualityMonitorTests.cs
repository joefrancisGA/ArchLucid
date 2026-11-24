using ArchLucid.AgentRuntime.Quality;
using ArchLucid.Core.Resilience;

using FluentAssertions;

using Microsoft.Extensions.Options;
using Microsoft.Extensions.Logging.Abstractions;

using Moq;

namespace ArchLucid.AgentRuntime.Tests.Quality;

[Trait("Category", "Unit")]
public sealed class ProviderQualityMonitorTests
{
    private static readonly ProviderQualityKey PrimaryKey =
        ProviderQualityKey.Create("azure-openai", "primary", "2026-11-01");

    [Fact]
    public void Unknown_and_non_independent_labels_never_count_as_success()
    {
        ProviderQualityMonitor monitor = CreateMonitor(minimumSamples: 5);
        monitor.Record(Sample("u", ProviderQualityLabel.Unknown, independent: true));
        monitor.Record(Sample("self", ProviderQualityLabel.Supported, independent: false));

        ProviderQualitySnapshot snapshot = monitor.GetSnapshot(PrimaryKey);

        snapshot.KnownSampleCount.Should().Be(0);
        snapshot.UnknownSampleCount.Should().Be(2);
        snapshot.Quarantined.Should().BeFalse();
    }

    [Fact]
    public void Minimum_sample_and_wilson_safeguards_prevent_false_alarm()
    {
        ProviderQualityMonitor monitor = CreateMonitor(minimumSamples: 10);
        for (int i = 0; i < 9; i++)
            monitor.Record(Sample($"bad-{i}", ProviderQualityLabel.Unsupported, independent: true));

        monitor.GetSnapshot(PrimaryKey).Quarantined.Should().BeFalse();
    }

    [Fact]
    public void Severity_weighted_independent_failures_open_quarantine()
    {
        ProviderQualityMonitor monitor = CreateMonitor(minimumSamples: 10);
        ProviderQualityRecordResult last = default!;
        for (int i = 0; i < 10; i++)
            last = monitor.Record(Sample($"bad-{i}", ProviderQualityLabel.Unsupported, independent: true, severity: 4));

        last.Transition.Should().Be("quarantined");
        last.Snapshot.Quarantined.Should().BeTrue();
        last.Snapshot.WeightedBadRate.Should().Be(1.0);
        monitor.Admit("azure-openai", "primary").Allowed.Should().BeFalse();
    }

    [Fact]
    public void Supported_majority_does_not_quarantine()
    {
        ProviderQualityMonitor monitor = CreateMonitor(minimumSamples: 10);
        for (int i = 0; i < 8; i++)
            monitor.Record(Sample($"good-{i}", ProviderQualityLabel.Supported, independent: true, severity: 4));
        for (int i = 0; i < 2; i++)
            monitor.Record(Sample($"bad-{i}", ProviderQualityLabel.Unsupported, independent: true));

        ProviderQualitySnapshot snapshot = monitor.GetSnapshot(PrimaryKey);
        snapshot.KnownSampleCount.Should().Be(10);
        snapshot.Quarantined.Should().BeFalse();
    }

    [Fact]
    public void Quarantine_admits_one_bounded_probe_and_independent_support_recovers()
    {
        ManualTimeProvider clock = new();
        ProviderQualityMonitor monitor = CreateMonitor(5, clock);
        for (int i = 0; i < 5; i++)
            monitor.Record(Sample($"bad-{i}", ProviderQualityLabel.Contradicted, independent: true));

        clock.Advance(TimeSpan.FromSeconds(31));
        ProviderQualityAdmission first = monitor.Admit("azure-openai", "primary");
        ProviderQualityAdmission second = monitor.Admit("azure-openai", "primary");

        first.Allowed.Should().BeTrue();
        first.RecoveryProbe.Should().BeTrue();
        second.Allowed.Should().BeFalse();

        ProviderQualityRecordResult recovered = monitor.Record(
            Sample("recovery", ProviderQualityLabel.Supported, independent: true));

        recovered.Transition.Should().Be("recovered");
        recovered.Snapshot.Quarantined.Should().BeFalse();
        monitor.Admit("azure-openai", "primary").Allowed.Should().BeTrue();
    }

    [Fact]
    public async Task Quarantined_primary_uses_existing_fallback_chain()
    {
        ProviderQualityMonitor monitor = CreateMonitor(5);
        for (int i = 0; i < 5; i++)
            monitor.Record(Sample($"bad-{i}", ProviderQualityLabel.Unsupported, independent: true));

        Mock<IAgentCompletionClient> primaryInner = new();
        primaryInner.SetupGet(x => x.Descriptor).Returns(
            LlmProviderDescriptor.ForAzureOpenAi(new Uri("https://primary.example"), "primary"));
        IAgentCompletionClient primary = new ProviderQualityQuarantiningAgentCompletionClient(
            primaryInner.Object, monitor);

        Mock<IAgentCompletionClient> secondary = new();
        secondary.SetupGet(x => x.Descriptor).Returns(
            LlmProviderDescriptor.ForAzureOpenAi(new Uri("https://secondary.example"), "secondary"));
        secondary.Setup(x => x.CompleteJsonAsync(
                "s", "u", It.IsAny<int?>(), It.IsAny<float?>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync("{\"from\":\"secondary\"}");

        FallbackAgentCompletionClient sut = new(
            primary, secondary.Object, NullLogger<FallbackAgentCompletionClient>.Instance);

        string result = await sut.CompleteJsonAsync("s", "u");

        result.Should().Contain("secondary");
        primaryInner.Verify(x => x.CompleteJsonAsync(
            It.IsAny<string>(), It.IsAny<string>(), It.IsAny<int?>(), It.IsAny<float?>(), It.IsAny<CancellationToken>()), Times.Never);
        secondary.Verify(x => x.CompleteJsonAsync(
            "s", "u", It.IsAny<int?>(), It.IsAny<float?>(), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Quarantined_primary_and_fallback_fail_closed()
    {
        ProviderQualityMonitor monitor = CreateMonitor(5);
        ProviderQualityKey secondaryKey = ProviderQualityKey.Create("azure-openai", "secondary", "2026-11-01");
        for (int i = 0; i < 5; i++)
        {
            monitor.Record(Sample($"p-{i}", ProviderQualityLabel.Unsupported, independent: true));
            monitor.Record(new ProviderQualityAdjudication(
                $"s-{i}", secondaryKey, ProviderQualityLabel.Unsupported, 4, true,
                "deterministic", DateTimeOffset.UtcNow));
        }

        Mock<IAgentCompletionClient> primaryInner = Client("primary");
        Mock<IAgentCompletionClient> secondaryInner = Client("secondary");
        IAgentCompletionClient primary = new ProviderQualityQuarantiningAgentCompletionClient(primaryInner.Object, monitor);
        IAgentCompletionClient secondary = new ProviderQualityQuarantiningAgentCompletionClient(secondaryInner.Object, monitor);
        FallbackAgentCompletionClient sut = new(
            primary, secondary, NullLogger<FallbackAgentCompletionClient>.Instance);

        Func<Task> act = () => sut.CompleteJsonAsync("s", "u");

        await act.Should().ThrowAsync<ProviderQualityQuarantinedException>();
        primaryInner.Verify(x => x.CompleteJsonAsync(
            It.IsAny<string>(), It.IsAny<string>(), It.IsAny<int?>(), It.IsAny<float?>(), It.IsAny<CancellationToken>()), Times.Never);
        secondaryInner.Verify(x => x.CompleteJsonAsync(
            It.IsAny<string>(), It.IsAny<string>(), It.IsAny<int?>(), It.IsAny<float?>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task Durable_state_aggregates_replicas_deduplicates_and_survives_monitor_recreation()
    {
        SharedTestStore store = new();
        ManualTimeProvider clock = new();
        DurableProviderQualityMonitor a = CreateDurableMonitor(store, clock);
        DurableProviderQualityMonitor b = CreateDurableMonitor(store, clock);
        CancellationToken ct = CancellationToken.None;

        await a.RecordAsync(Sample("first", ProviderQualityLabel.Unsupported, true), ct);
        ProviderQualityRecordResult duplicate = await b.RecordAsync(
            Sample("first", ProviderQualityLabel.Unsupported, true), ct);
        duplicate.Snapshot.KnownSampleCount.Should().Be(1);
        for (int i = 1; i < 5; i++)
            await (i % 2 == 0 ? a : b).RecordAsync(Sample($"bad-{i}", ProviderQualityLabel.Unsupported, true), ct);

        DurableProviderQualityMonitor restarted = CreateDurableMonitor(store, clock);
        (await restarted.AdmitAsync("AZURE-OPENAI", "PRIMARY", ct)).Allowed.Should().BeFalse();
        (await restarted.AdmitAsync("azure-openai", "other", ct)).Allowed.Should().BeTrue();
    }

    [Fact]
    public async Task Durable_recovery_admits_only_one_replica_and_rejects_unrelated_recovery_evidence()
    {
        SharedTestStore store = new();
        ManualTimeProvider clock = new();
        DurableProviderQualityMonitor a = CreateDurableMonitor(store, clock);
        DurableProviderQualityMonitor b = CreateDurableMonitor(store, clock);
        CancellationToken ct = CancellationToken.None;

        for (int i = 0; i < 5; i++)
            await a.RecordAsync(Sample($"bad-{i}", ProviderQualityLabel.Contradicted, true), ct);

        clock.Advance(TimeSpan.FromSeconds(31));
        ProviderQualityAdmission[] admissions = await Task.WhenAll(
            Task.Run(() => a.AdmitAsync("azure-openai", "primary", ct), ct),
            Task.Run(() => b.AdmitAsync("azure-openai", "primary", ct), ct));
        admissions.Count(static admission => admission.RecoveryProbe).Should().Be(1);
        admissions.Count(static admission => admission.Allowed).Should().Be(1);

        ProviderQualityRecordResult unrelated = await b.RecordAsync(
            Sample("ordinary-response", ProviderQualityLabel.Supported, true), ct);
        unrelated.Snapshot.Quarantined.Should().BeTrue();
        unrelated.Snapshot.RecoveryProbeInFlight.Should().BeTrue();
        clock.Advance(TimeSpan.FromSeconds(11));
        (await b.AdmitAsync("azure-openai", "primary", ct)).Allowed.Should().BeFalse();
    }

    private static DurableProviderQualityMonitor CreateDurableMonitor(SharedTestStore store, TimeProvider clock) =>
        new(Options.Create(new ProviderQualityOptions
        {
            MinimumIndependentKnownSamples = 5,
            QuarantineSeconds = 30,
            RecoveryProbeLeaseSeconds = 10,
        }), store, clock);

    private sealed class SharedTestStore : IProviderQualityStateStore
    {
        private readonly Dictionary<string, string> _states = new(StringComparer.Ordinal);
        private readonly Lock _sync = new();

        public Task<TResult> UpdateAsync<TResult>(string deploymentKey,
            Func<string?, (string? Replacement, TResult Result)> update, CancellationToken cancellationToken)
        {
            cancellationToken.ThrowIfCancellationRequested();
            lock (_sync)
            {
                (string? replacement, TResult result) = update(_states.GetValueOrDefault(deploymentKey));
                if (replacement is not null)
                    _states[deploymentKey] = replacement;
                return Task.FromResult(result);
            }
        }
    }

    private static ProviderQualityMonitor CreateMonitor(int minimumSamples, TimeProvider? clock = null)
    {
        ProviderQualityOptions options = new()
        {
            MinimumIndependentKnownSamples = minimumSamples,
            MaximumWeightedBadRate = 0.35,
            MinimumWilsonBadRate = 0.20,
            QuarantineSeconds = 30,
            RecoveryProbeLeaseSeconds = 10,
        };
        return new ProviderQualityMonitor(Options.Create(options), clock);
    }

    private static ProviderQualityAdjudication Sample(
        string id,
        ProviderQualityLabel label,
        bool independent,
        int severity = 1) =>
        new(id, PrimaryKey, label, severity, independent, "deterministic", DateTimeOffset.UtcNow);

    private sealed class ManualTimeProvider : TimeProvider
    {
        private DateTimeOffset _utcNow = DateTimeOffset.UnixEpoch;
        public override DateTimeOffset GetUtcNow() => _utcNow;
        internal void Advance(TimeSpan value) => _utcNow = _utcNow.Add(value);
    }

    private static Mock<IAgentCompletionClient> Client(string model)
    {
        Mock<IAgentCompletionClient> client = new(MockBehavior.Strict);
        client.SetupGet(x => x.Descriptor).Returns(
            LlmProviderDescriptor.ForAzureOpenAi(new Uri($"https://{model}.example"), model));
        return client;
    }
}
