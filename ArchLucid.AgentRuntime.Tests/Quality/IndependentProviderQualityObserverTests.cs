using Xunit;

using System.Text.Json;

using ArchLucid.AgentRuntime.Quality;
using ArchLucid.Core.Agents;
using ArchLucid.Contracts.ArchitectureIntelligence;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Llm;
using ArchLucid.Core.Scoping;

using FluentAssertions;

using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.AgentRuntime.Tests.Quality;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
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

    [Theory]
    [InlineData("complete", false)]
    [InlineData("partial", true)]
    [InlineData("contradiction", true)]
    [InlineData("extra", true)]
    [InlineData("wrong-nonce", true)]
    [InlineData("wrong-trace", true)]
    [InlineData("expired", true)]
    [InlineData("copy", true)]
    public async Task SecureNow_recovery_can_clear_only_its_exact_complete_synthetic_response(string scenario, bool quarantined)
    {
        ProviderQualityKey key = ProviderQualityKey.Create("azure-openai", "primary", "v7");
        ManualClock clock = new();
        const int leaseSeconds = 20;
        ProviderQualityMonitor monitor = new(Options.Create(new ProviderQualityOptions
        {
            MinimumIndependentKnownSamples = 5,
            QuarantineSeconds = 30,
            RecoveryProbeLeaseSeconds = leaseSeconds,
        }), clock);
        for (int i = 0; i < 5; i++)
            monitor.Record(new ProviderQualityAdjudication(
                $"bad-{i}", key, ProviderQualityLabel.Contradicted, 4, true, "deterministic", clock.GetUtcNow()));

        clock.Advance(TimeSpan.FromSeconds(31));
        Mock<IAgentCompletionClient> inner = new(MockBehavior.Strict);
        inner.SetupGet(x => x.Descriptor).Returns(LlmProviderDescriptor.ForAzureOpenAi(new Uri("https://primary.example"), "primary"));
        inner.Setup(x => x.CompleteJsonAsync(SecureNowRecoveryChallenge.SystemPrompt, It.IsAny<string>(),
                128, null, It.IsAny<CancellationToken>()))
            .ReturnsAsync((string _, string prompt, int? _, float? _, CancellationToken _) =>
            {
                prompt.Should().NotContain("private-customer-fixture");
                string response = AnswerSyntheticFixture(prompt, scenario);
                ProviderQualityRecoveryResponse.ConfirmTransport("primary", "v7", response);
                IndependentProviderQualityObserver.ConfirmHostedTransport("primary", "v7", response);
                return scenario == "copy" ? new string(response.AsSpan()) : response;
            });

        using ProviderQualityQuarantiningAgentCompletionClient client = new(inner.Object, monitor);
        Mock<IAuditService> audit = new();
        AuditEvent? recorded = null;
        audit.Setup(x => x.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()))
            .Callback<AuditEvent, CancellationToken>((item, _) => recorded = item)
            .Returns(Task.CompletedTask);
        IndependentProviderQualityObserver observer = new(monitor, audit.Object);
        var observed = await observer.ObserveAsync(async ct =>
        {
            string response = await client.CompleteJsonAsync("original instruction", "private-customer-fixture",
                maxTokens: 800, cancellationToken: ct);
            // The ordinary ArchLucid trace consumer must not take the SecureNow-only stamp.
            ProviderQualityRecoveryResponse.TryTake(response, out _).Should().BeFalse();
            return response;
        }, CancellationToken.None);

        inner.Verify(x => x.CompleteJsonAsync(SecureNowRecoveryChallenge.SystemPrompt, It.IsAny<string>(),
            128, null, It.IsAny<CancellationToken>()), Times.Once);
        if (scenario == "copy")
        {
            observed.Sample.Should().BeNull();
            monitor.GetSnapshot(key).Quarantined.Should().BeTrue();
            return;
        }

        observed.Sample.Should().NotBeNull();
        observed.Sample!.IsSyntheticRecovery.Should().BeTrue();
        if (scenario == "wrong-trace")
        {
            // Consume the still-current lease's binding through the monitor, under a different trace.
            string payload = monitor.ExportState();
            using JsonDocument state = JsonDocument.Parse(payload);
            Guid leaseId = state.RootElement.EnumerateArray().Single().GetProperty("State").GetProperty("RecoveryLeaseId").GetGuid();
            monitor.BindRecoveryTrace(key, leaseId, "unrelated-trace").Should().BeTrue();
        }
        if (scenario == "expired")
            clock.Advance(TimeSpan.FromSeconds(leaseSeconds + 1));

        ScopeContext scope = new() { TenantId = Guid.NewGuid(), WorkspaceId = Guid.NewGuid(), ProjectId = Guid.NewGuid() };
        await observed.Sample.RecordAsync(scope, Guid.NewGuid(), IndependentProviderClaimOutcome.Supported,
            true, null, CancellationToken.None);
        ProviderQualitySnapshot current = monitor.GetSnapshot(key);
        current.Quarantined.Should().Be(quarantined);
        if (scenario is "wrong-trace" or "expired")
        {
            current.KnownSampleCount.Should().Be(5);
            current.UnknownSampleCount.Should().Be(0);
            recorded.Should().BeNull();
        }
        if (!quarantined)
        {
            current.DecisionWindowKnownSamples.Should().Be(0);
            recorded.Should().NotBeNull();
            recorded!.DataJson.Should().Contain("\"recovered\"")
                .And.Contain(SecureNowRecoveryChallenge.Method).And.NotContain(observed.Response);
        }
    }

    private static string AnswerSyntheticFixture(string prompt, string scenario)
    {
        using JsonDocument challenge = JsonDocument.Parse(prompt);
        string? nonce = challenge.RootElement.GetProperty("nonce").GetString();
        var results = challenge.RootElement.GetProperty("rows").EnumerateArray().Select(row =>
            !row.GetProperty("redacted").GetBoolean() && row.GetProperty("publicNetworkAccess").ValueKind == JsonValueKind.String
                ? row.GetProperty("publicNetworkAccess").GetString() switch
                {
                    "Disabled" => "disabled",
                    "Enabled" => "enabled",
                    _ => "unknown",
                }
                : "unknown").ToArray();

        if (scenario == "partial")
            results = results[..^1];
        if (scenario == "contradiction")
            results[0] = results[0] == "enabled" ? "disabled" : "enabled";
        if (scenario == "wrong-nonce")
            nonce = Guid.NewGuid().ToString("N");
        return scenario == "extra"
            ? JsonSerializer.Serialize(new { nonce, results, unsupported = "extra factual claim" })
            : JsonSerializer.Serialize(new { nonce, results });
    }

    private sealed class ManualClock : TimeProvider
    {
        private DateTimeOffset _now = DateTimeOffset.UnixEpoch;

        public override DateTimeOffset GetUtcNow() => _now;

        internal void Advance(TimeSpan interval) => _now += interval;
    }
}
