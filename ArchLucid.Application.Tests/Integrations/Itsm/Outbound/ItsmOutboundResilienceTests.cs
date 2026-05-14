using System.Net;

using ArchLucid.Application.Integrations.Itsm.Outbound;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Integrations;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.TestSupport.Http;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;

using Moq;

using Polly;
using Polly.Retry;

namespace ArchLucid.Application.Tests.Integrations.Itsm.Outbound;

[Trait("Suite", "Core")]
[Trait("Category", "Integration")]
public sealed class ItsmOutboundResilienceTests
{
    [Fact]
    public async Task TryCreateForFindingAsync_with_resilience_pipeline_retries_transient_500s_and_eventually_audits_failure_as_dead_letter()
    {
        int attemptCount = 0;

        // Simulate an HTTP handler that always returns 500
        var httpHandler = new DelegateHttpMessageHandler((request, ct) =>
        {
            Interlocked.Increment(ref attemptCount);
            return Task.FromResult(new HttpResponseMessage(HttpStatusCode.InternalServerError));
        });

        // Set up Polly retry pipeline to wrap the HttpClient (simulating host DI configuration)
        var retryPipeline = new ResiliencePipelineBuilder<HttpResponseMessage>()
            .AddRetry(new RetryStrategyOptions<HttpResponseMessage>
            {
                ShouldHandle = new PredicateBuilder<HttpResponseMessage>().HandleResult(r => r.StatusCode == HttpStatusCode.InternalServerError),
                MaxRetryAttempts = 2,
                Delay = TimeSpan.FromMilliseconds(5),
                BackoffType = DelayBackoffType.Constant
            })
            .Build();

        var resilientHandler = new ResilienceHttpMessageHandler(retryPipeline, httpHandler);
        
        using HttpClient jiraHttp = new(resilientHandler) { Timeout = TimeSpan.FromSeconds(5) };

        Mock<IFindingInspectReadRepository> findings = new();
        findings.Setup(f => f.GetInspectAsync(It.IsAny<ScopeContext>(), "f-500", It.IsAny<CancellationToken>()))
            .ReturnsAsync(ItsmOutboundConnectorTestFixture.Inspect(Contracts.Findings.FindingSeverity.Error, findingId: "f-500"));

        var options = ItsmOutboundConnectorTestFixture.OutboundJiraConfigured();
        options.Jira.CloudBaseUrl = "https://mock.jira.local";

        var sut = new ItsmOutboundIssueCreationService(
            findings.Object,
            Mock.Of<IItsmFindingCorrelationRepository>(),
            Mock.Of<ITenantItsmOutboundSettingsRepository>(),
            Mock.Of<IRunRepository>(),
            Mock.Of<IArchitectureRequestRepository>(),
            ItsmOutboundConnectorTestFixture.Monitor(options).Object,
            ItsmOutboundConnectorTestFixture.PublicSiteMonitor().Object,
            new JiraOutboundIssueClient(jiraHttp, NullLogger<JiraOutboundIssueClient>.Instance),
            new ServiceNowOutboundIncidentClient(new HttpClient(new UnexpectedHttpCallMessageHandler()), NullLogger<ServiceNowOutboundIncidentClient>.Instance));

        var result = await sut.TryCreateForFindingAsync(ItsmOutboundIssueProvider.Jira, ItsmOutboundConnectorTestFixture.Scope(), "f-500", CancellationToken.None);

        // Verify retries happened (1 initial + 2 retries = 3 total attempts)
        attemptCount.Should().Be(3);

        // Verify it returns the appropriate failure without crashing the caller
        result.Kind.Should().Be(ItsmOutboundCreateTerminalKind.VendorError);
        result.VendorStatusCode.Should().Be(500);

        // Verify the failure is audited (acting as our dead-letter log for correlation)
        result.AuditEvents.Should().ContainSingle();
        var audit = result.AuditEvents.Single();
        audit.EventType.Should().Be(AuditEventTypes.IntegrationJiraIssueCreateFailed);
        audit.DataJson.Should().Contain("f-500");
    }
    
    [Fact]
    public async Task TryCreateForFindingAsync_ServiceNow_retries_transient_500s_and_eventually_audits_failure()
    {
        int attemptCount = 0;

        var httpHandler = new DelegateHttpMessageHandler((request, ct) =>
        {
            Interlocked.Increment(ref attemptCount);
            return Task.FromResult(new HttpResponseMessage(HttpStatusCode.InternalServerError));
        });

        var retryPipeline = new ResiliencePipelineBuilder<HttpResponseMessage>()
            .AddRetry(new RetryStrategyOptions<HttpResponseMessage>
            {
                ShouldHandle = new PredicateBuilder<HttpResponseMessage>().HandleResult(r => r.StatusCode == HttpStatusCode.InternalServerError),
                MaxRetryAttempts = 1,
                Delay = TimeSpan.FromMilliseconds(5),
                BackoffType = DelayBackoffType.Constant
            })
            .Build();

        var resilientHandler = new ResilienceHttpMessageHandler(retryPipeline, httpHandler);
        
        using HttpClient snowHttp = new(resilientHandler) { Timeout = TimeSpan.FromSeconds(5) };

        Mock<IFindingInspectReadRepository> findings = new();
        findings.Setup(f => f.GetInspectAsync(It.IsAny<ScopeContext>(), "f-sn-500", It.IsAny<CancellationToken>()))
            .ReturnsAsync(ItsmOutboundConnectorTestFixture.Inspect(Contracts.Findings.FindingSeverity.Error, findingId: "f-sn-500"));

        Mock<IRunRepository> runs = new();
        runs.Setup(r => r.GetByIdAsync(It.IsAny<ScopeContext>(), It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Persistence.Models.RunRecord());

        var options = ItsmOutboundConnectorTestFixture.OutboundServiceNowConfigured("https://mock.sn.local");

        var sut = new ItsmOutboundIssueCreationService(
            findings.Object,
            Mock.Of<IItsmFindingCorrelationRepository>(),
            Mock.Of<ITenantItsmOutboundSettingsRepository>(),
            runs.Object,
            Mock.Of<IArchitectureRequestRepository>(),
            ItsmOutboundConnectorTestFixture.Monitor(options).Object,
            ItsmOutboundConnectorTestFixture.PublicSiteMonitor().Object,
            new JiraOutboundIssueClient(new HttpClient(new UnexpectedHttpCallMessageHandler()), NullLogger<JiraOutboundIssueClient>.Instance),
            new ServiceNowOutboundIncidentClient(snowHttp, NullLogger<ServiceNowOutboundIncidentClient>.Instance));

        var result = await sut.TryCreateForFindingAsync(ItsmOutboundIssueProvider.ServiceNow, ItsmOutboundConnectorTestFixture.Scope(), "f-sn-500", CancellationToken.None);

        // 1 initial + 1 retry = 2
        attemptCount.Should().Be(2);

        result.Kind.Should().Be(ItsmOutboundCreateTerminalKind.VendorError);
        result.VendorStatusCode.Should().Be(500);

        result.AuditEvents.Should().ContainSingle();
        var audit = result.AuditEvents.Single();
        audit.EventType.Should().Be(AuditEventTypes.IntegrationServiceNowIncidentCreateFailed);
        audit.DataJson.Should().Contain("f-sn-500");
    }

    private class DelegateHttpMessageHandler(Func<HttpRequestMessage, CancellationToken, Task<HttpResponseMessage>> handler) : HttpMessageHandler
    {
        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            return handler(request, cancellationToken);
        }
    }

    private class ResilienceHttpMessageHandler(ResiliencePipeline<HttpResponseMessage> pipeline, HttpMessageHandler innerHandler) : DelegatingHandler(innerHandler)
    {
        protected override async Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            return await pipeline.ExecuteAsync(async ct => await base.SendAsync(request, ct), cancellationToken);
        }
    }
}
