using ArchLucid.AgentRuntime.Quality;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Llm;
using ArchLucid.Core.Scoping;

using FluentAssertions;

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

    [Fact]
    public async Task Live_response_reports_one_contradiction_for_the_actual_provider_deployment_and_version()
    {
        ProviderQualityKey key = ProviderQualityKey.Create("azure-openai", "actual-fallback", "v7");
        Mock<IProviderQualityMonitor> monitor = new(MockBehavior.Strict);
        Mock<IAuditService> audit = new(MockBehavior.Strict);
        ScopeContext scope = new() { TenantId = Guid.NewGuid(), WorkspaceId = Guid.NewGuid(), ProjectId = Guid.NewGuid() };
        string response = new("sensitive answer body".AsSpan());
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
        await result.Sample!.RecordAsync(scope, IndependentProviderClaimOutcome.Contradicted, true, ct);
        await result.Sample.RecordAsync(scope, IndependentProviderClaimOutcome.Contradicted, true, ct);
        monitor.Verify(x => x.RecordAsync(It.IsAny<ProviderQualityAdjudication>(), ct), Times.Once);
        audit.Verify(x => x.LogAsync(It.IsAny<AuditEvent>(), ct), Times.Once);
    }
}
