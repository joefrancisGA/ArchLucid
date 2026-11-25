using System.Text.Json;

using ArchLucid.AgentRuntime.Quality;
using ArchLucid.Contracts.ArchitectureIntelligence;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Llm;
using ArchLucid.Core.Scoping;

using FluentAssertions;

using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.AgentRuntime.Tests.Quality;

public sealed class IndependentProviderQualityObserverTests
{
    [Fact]
    public async Task Attribution_requires_the_exact_live_response_and_known_model_version()
    {
        Mock<IProviderQualityMonitor> monitor = new(MockBehavior.Strict);
        IndependentProviderQualityObserver observer = new(monitor.Object, Mock.Of<IAuditService>());
        CancellationToken ct = CancellationToken.None;
        string response = new("provider response".AsSpan());

        (await observer.ObserveAsync(_ => Task.FromResult(response), ct)).Sample.Should().BeNull();
        (await observer.ObserveAsync(_ =>
        {
            IndependentProviderQualityObserver.ConfirmHostedTransport("actual-fallback", null, response);
            return Task.FromResult(response);
        }, ct)).Sample.Should().BeNull();
        (await observer.ObserveAsync(_ =>
        {
            IndependentProviderQualityObserver.ConfirmHostedTransport("actual-fallback", "v7", response);
            return Task.FromResult(new string(response.AsSpan()));
        }, ct)).Sample.Should().BeNull();
        monitor.VerifyNoOtherCalls();
    }

    [Theory]
    [InlineData("scoped")]
    [InlineData("foreign")]
    [InlineData("mismatch")]
    [InlineData("legacy")]
    public async Task Live_response_reports_one_contradiction_and_only_attaches_matching_provenance(string scenario)
    {
        ProviderQualityKey key = ProviderQualityKey.Create("azure-openai", "actual-fallback", "v7");
        Mock<IProviderQualityMonitor> monitor = new(MockBehavior.Strict);
        Mock<IAuditService> audit = new(MockBehavior.Strict);
        ScopeContext scope = new() { TenantId = Guid.NewGuid(), WorkspaceId = Guid.NewGuid(), ProjectId = Guid.NewGuid() };
        string response = new("sensitive answer body".AsSpan());
        Guid explanationId = Guid.NewGuid(), resourceId = Guid.NewGuid(), snapshotId = Guid.NewGuid(), rowId = Guid.NewGuid();
        var verification = new PublicNetworkAccessVerification(
            resourceId, PublicNetworkAccessVerificationOutcome.Contradicted, snapshotId,
            new DateTime(2026, 11, 25, 0, 0, 0, DateTimeKind.Utc))
        {
            Evidence = new PublicNetworkAccessVerificationEvidence(
                "azure-inventory-public-network-access/1", scope.TenantId, scope.WorkspaceId,
                scenario == "foreign" ? Guid.NewGuid() : scope.ProjectId, rowId, "publicNetworkAccess", 24),
        };
        InventoryFalsificationProbe? probe = scenario == "legacy" ? null : new InventoryFalsificationProbe(
            scenario == "mismatch" ? InventoryFalsificationOutcome.SurvivedWithinTestedScope : InventoryFalsificationOutcome.Refuted,
            "The explicit Azure property only, for the cited resource and snapshot.", verification);
        AuditEvent? persisted = null;
        monitor.Setup(x => x.RecordAsync(It.Is<ProviderQualityAdjudication>(item => item.Key == key
                && item.Label == ProviderQualityLabel.Contradicted && item.Independent
                && item.SeverityWeight == 4 && item.SampleId.Length == 64
                && !item.SampleId.Contains(response, StringComparison.Ordinal)), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ProviderQualityRecordResult(
                new ProviderQualitySnapshot(key, 8, 1, 7, .9, .5, true, null, false, false, null),
                true, "quarantined"));
        audit.Setup(x => x.LogAsync(It.Is<AuditEvent>(item => item.TenantId == scope.TenantId
                && item.WorkspaceId == scope.WorkspaceId && item.ProjectId == scope.ProjectId
                && !item.DataJson.Contains(response, StringComparison.Ordinal)), It.IsAny<CancellationToken>()))
            .Callback<AuditEvent, CancellationToken>((item, _) => persisted = item)
            .Returns(Task.CompletedTask);

        IndependentProviderQualityObserver observer = new(monitor.Object, audit.Object);
        CancellationToken ct = CancellationToken.None;
        var result = await observer.ObserveAsync(async _ =>
        {
            await Task.Yield();
            IndependentProviderQualityObserver.ConfirmHostedTransport("actual-fallback", "v7", response);
            return response;
        }, ct);

        result.Sample.Should().NotBeNull();
        await result.Sample!.RecordAsync(scope, explanationId, IndependentProviderClaimOutcome.Contradicted, true, probe, ct);
        await result.Sample.RecordAsync(scope, Guid.NewGuid(), IndependentProviderClaimOutcome.Contradicted, true, probe, ct);
        monitor.Verify(x => x.RecordAsync(It.IsAny<ProviderQualityAdjudication>(), ct), Times.Once);
        audit.Verify(x => x.LogAsync(It.IsAny<AuditEvent>(), ct), Times.Once);

        using JsonDocument payload = JsonDocument.Parse(persisted!.DataJson);
        payload.RootElement.GetProperty("explanationId").GetGuid().Should().Be(explanationId);
        JsonElement provenance = payload.RootElement.GetProperty("inventoryFalsification");
        if (scenario == "scoped")
            provenance.Deserialize<InventoryFalsificationProbe>().Should().Be(probe);
        else
            provenance.ValueKind.Should().Be(JsonValueKind.Null);
    }

    [Theory]
    [InlineData(IndependentProviderClaimOutcome.Supported, 5, 1)]
    [InlineData(IndependentProviderClaimOutcome.Contradicted, 6, 0)]
    [InlineData(IndependentProviderClaimOutcome.Unknown, 5, 1)]
    public async Task Exact_recovery_attempt_cannot_be_cleared_by_a_partial_inventory_check(
        IndependentProviderClaimOutcome outcome, int expectedKnown, int expectedUnknown)
    {
        ProviderQualityKey key = ProviderQualityKey.Create("azure-openai", "primary", "v7");
        ManualClock clock = new();
        ProviderQualityMonitor monitor = new(Options.Create(new ProviderQualityOptions
        {
            MinimumIndependentKnownSamples = 5,
            QuarantineSeconds = 30,
        }), clock);
        for (int i = 0; i < 5; i++)
            monitor.Record(new ProviderQualityAdjudication(
                $"bad-{i}", key, ProviderQualityLabel.Contradicted, 4, true, "deterministic", clock.GetUtcNow()));

        clock.Advance(TimeSpan.FromSeconds(31));
        ProviderQualityAdmission admission = monitor.Admit("azure-openai", "primary");
        admission.RecoveryProbe.Should().BeTrue();
        Guid explanationId = Guid.NewGuid();
        ScopeContext scope = new() { TenantId = Guid.NewGuid(), WorkspaceId = Guid.NewGuid(), ProjectId = Guid.NewGuid() };
        Mock<IAuditService> audit = new(MockBehavior.Strict);
        audit.Setup(x => x.LogAsync(It.Is<AuditEvent>(item => item.TenantId == scope.TenantId
                && item.EventType == "AiProviderQualityQuarantined"
                && item.DataJson.Contains("reopened", StringComparison.Ordinal)
                && item.DataJson.Contains(explanationId.ToString(), StringComparison.Ordinal)),
            It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);
        IndependentProviderQualityObserver observer = new(monitor, audit.Object);
        CancellationToken ct = CancellationToken.None;

        var observed = await observer.ObserveAsync(_ =>
        {
            string providerResponse = new("recovery response".AsSpan());
            using ProviderQualityRecoveryResponse.Capture? capture = ProviderQualityRecoveryResponse.Begin(admission);
            ProviderQualityRecoveryResponse.ConfirmTransport("primary", "v7", providerResponse);
            IndependentProviderQualityObserver.ConfirmHostedTransport("primary", "v7", providerResponse);
            return Task.FromResult(capture!.Attach(providerResponse));
        }, ct);

        observed.Sample.Should().NotBeNull();
        await observed.Sample!.RecordAsync(scope, explanationId, outcome, true, null, ct);
        ProviderQualitySnapshot state = monitor.GetSnapshot(key);
        state.Quarantined.Should().BeTrue();
        state.RecoveryProbeInFlight.Should().BeFalse();
        state.KnownSampleCount.Should().Be(expectedKnown);
        state.UnknownSampleCount.Should().Be(expectedUnknown);
        audit.Verify(x => x.LogAsync(It.IsAny<AuditEvent>(), ct), Times.Once);
    }

    private sealed class ManualClock : TimeProvider
    {
        private DateTimeOffset _now = DateTimeOffset.UnixEpoch;

        public override DateTimeOffset GetUtcNow() => _now;

        internal void Advance(TimeSpan interval) => _now += interval;
    }
}
