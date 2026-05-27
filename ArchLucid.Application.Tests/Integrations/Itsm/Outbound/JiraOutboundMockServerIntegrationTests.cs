using System.Diagnostics;
using System.Net;
using System.Text.Json;

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

using static ArchLucid.Application.Tests.Integrations.Itsm.Outbound.ItsmOutboundConnectorTestFixture;

namespace ArchLucid.Application.Tests.Integrations.Itsm.Outbound;

[Trait("Suite", "Core")]
[Trait("Category", "Integration")]
public sealed class JiraOutboundMockServerIntegrationTests
{
    [Fact]
    public async Task CreateIssue_succeeds_persists_correlation_and_emits_succeeded_audit()
    {
        await using JiraIssueCreateInProcessMockServer server = await JiraIssueCreateInProcessMockServer.StartAsync(async (context, cancellationToken) =>
        {
            HttpListenerResponse response = context.Response;
            response.StatusCode = 201;
            response.ContentType = "application/json; charset=utf-8";
            byte[] body = """{"id":"10042","key":"MOCK-7"}"""u8.ToArray();

            await response.OutputStream.WriteAsync(body, cancellationToken).ConfigureAwait(false);
            response.Close();
        });

        Mock<IFindingInspectReadRepository> findings = new();
        findings
            .Setup(f => f.GetInspectAsync(It.IsAny<ScopeContext>(), "f-open", It.IsAny<CancellationToken>()))
            .ReturnsAsync(Inspect(FindingSeverity.Error, findingId: "f-open"));

        Mock<IItsmFindingCorrelationRepository> correlations = new();
        correlations
            .Setup(c => c.RegisterAsync(
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                "f-open",
                "Jira",
                "MOCK-7",
                "10042",
                It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        ScopeContext scope = Scope();
        IntegrationsItsmOutboundOptions options = OutboundJiraConfigured();
        options.Jira.CloudBaseUrl = server.BaseUrl;

        ItsmOutboundIssueCreationService sut = new(
            findings.Object,
            correlations.Object,
            Mock.Of<ITenantItsmOutboundSettingsRepository>(),
            Mock.Of<IRunRepository>(),
            Mock.Of<IArchitectureRequestRepository>(),
            Monitor(options).Object,
            PublicSiteMonitor().Object,
            new JiraOutboundIssueClient(new HttpClient(new HttpClientHandler()) { Timeout = TimeSpan.FromSeconds(5) },
                NullLogger<JiraOutboundIssueClient>.Instance),
            ServiceNowClient(new UnexpectedHttpCallMessageHandler()));

        ItsmOutboundIssueCreationResult result = await sut.TryCreateForFindingAsync(ItsmOutboundIssueProvider.Jira, scope, "f-open", CancellationToken.None);

        result.Kind.Should().Be(ItsmOutboundCreateTerminalKind.Succeeded);
        result.ExternalKey.Should().Be("MOCK-7");

        AuditEvent audit = result.AuditEvents.Single();
        audit.EventType.Should().Be(AuditEventTypes.IntegrationJiraIssueCreateSucceeded);
        audit.DataJson.Should().Contain("MOCK-7");

        correlations.Verify(
            c => c.RegisterAsync(
                scope.TenantId,
                scope.WorkspaceId,
                scope.ProjectId,
                "f-open",
                "Jira",
                "MOCK-7",
                "10042",
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task CreateIssue_when_Jira_returns_401_emits_failed_audit_and_does_not_throw()
    {
        await using JiraIssueCreateInProcessMockServer server = await JiraIssueCreateInProcessMockServer.StartAsync((context, _) =>
        {
            context.Response.StatusCode = 401;
            context.Response.ContentLength64 = 0;
            context.Response.Close();

            return Task.CompletedTask;
        });

        Mock<IFindingInspectReadRepository> findings = new();
        findings
            .Setup(f => f.GetInspectAsync(It.IsAny<ScopeContext>(), "f-401", It.IsAny<CancellationToken>()))
            .ReturnsAsync(Inspect(FindingSeverity.Warning, findingId: "f-401"));

        ScopeContext scope = Scope();
        IntegrationsItsmOutboundOptions options = OutboundJiraConfigured();
        options.Jira.CloudBaseUrl = server.BaseUrl;

        ItsmOutboundIssueCreationService sut = new(
            findings.Object,
            Mock.Of<IItsmFindingCorrelationRepository>(),
            Mock.Of<ITenantItsmOutboundSettingsRepository>(),
            Mock.Of<IRunRepository>(),
            Mock.Of<IArchitectureRequestRepository>(),
            Monitor(options).Object,
            PublicSiteMonitor().Object,
            new JiraOutboundIssueClient(new HttpClient(new HttpClientHandler()) { Timeout = TimeSpan.FromSeconds(5) },
                NullLogger<JiraOutboundIssueClient>.Instance),
            ServiceNowClient(new UnexpectedHttpCallMessageHandler()));

        ItsmOutboundIssueCreationResult result = await sut.TryCreateForFindingAsync(ItsmOutboundIssueProvider.Jira, scope, "f-401", CancellationToken.None);

        result.Kind.Should().Be(ItsmOutboundCreateTerminalKind.VendorError);
        result.VendorStatusCode.Should().Be(401);

        AuditEvent audit = result.AuditEvents.Single();
        audit.EventType.Should().Be(AuditEventTypes.IntegrationJiraIssueCreateFailed);
        JsonDocument doc = JsonDocument.Parse(audit.DataJson);
        doc.RootElement.GetProperty("statusCode").GetInt32().Should().Be(401);
    }

    /// <summary>
    ///     Uses <see cref="JiraOutboundRateLimitRetryDelegatingHandler" /> so the mock can emit 429 then 201; production
    ///     <see cref="JiraOutboundIssueClient" /> has no built-in retry, but hosts may wrap <see cref="HttpClient" /> with resilience.
    /// </summary>
    [Fact]
    public async Task CreateIssue_when_Jira_rate_limits_once_then_accepts_resilient_pipeline_retries_and_succeeds()
    {
        int issueHits = 0;

        await using JiraIssueCreateInProcessMockServer server = await JiraIssueCreateInProcessMockServer.StartAsync(async (context, cancellationToken) =>
        {
            int n = Interlocked.Increment(ref issueHits);
            HttpListenerResponse response = context.Response;

            if (n == 1)
            {
                response.Headers.Set("Retry-After", "0");
                response.StatusCode = 429;
                response.Close();

                return;
            }

            response.StatusCode = 201;
            response.ContentType = "application/json; charset=utf-8";
            byte[] body = """{"id":"20001","key":"MOCK-RL-2"}"""u8.ToArray();

            await response.OutputStream.WriteAsync(body, cancellationToken).ConfigureAwait(false);
            response.Close();
        });

        Mock<IFindingInspectReadRepository> findings = new();
        findings
            .Setup(f => f.GetInspectAsync(It.IsAny<ScopeContext>(), "f-rl", It.IsAny<CancellationToken>()))
            .ReturnsAsync(Inspect(FindingSeverity.Critical, findingId: "f-rl"));

        Mock<IItsmFindingCorrelationRepository> correlations = new();
        correlations
            .Setup(c => c.RegisterAsync(
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                "f-rl",
                "Jira",
                "MOCK-RL-2",
                "20001",
                It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        ScopeContext scope = Scope();
        IntegrationsItsmOutboundOptions options = OutboundJiraConfigured();
        options.Jira.CloudBaseUrl = server.BaseUrl;

        HttpMessageHandler socketHandler = new HttpClientHandler();
        JiraOutboundRateLimitRetryDelegatingHandler resilience = new(socketHandler, maxAttempts: 3);

        using HttpClient httpForJira = new(resilience);
        httpForJira.Timeout = TimeSpan.FromSeconds(8);

        ItsmOutboundIssueCreationService sut = new(
            findings.Object,
            correlations.Object,
            Mock.Of<ITenantItsmOutboundSettingsRepository>(),
            Mock.Of<IRunRepository>(),
            Mock.Of<IArchitectureRequestRepository>(),
            Monitor(options).Object,
            PublicSiteMonitor().Object,
            new JiraOutboundIssueClient(httpForJira, NullLogger<JiraOutboundIssueClient>.Instance),
            ServiceNowClient(new UnexpectedHttpCallMessageHandler()));

        ItsmOutboundIssueCreationResult result = await sut.TryCreateForFindingAsync(ItsmOutboundIssueProvider.Jira, scope, "f-rl", CancellationToken.None);

        issueHits.Should().Be(2);
        result.Kind.Should().Be(ItsmOutboundCreateTerminalKind.Succeeded);
        result.AuditEvents.Single().EventType.Should().Be(AuditEventTypes.IntegrationJiraIssueCreateSucceeded);
    }

    [Fact]
    public async Task CreateIssue_when_upstream_stalls_respects_http_client_timeout_without_hanging()
    {
        await using JiraIssueCreateInProcessMockServer server = await JiraIssueCreateInProcessMockServer.StartAsync(async (_, cancellationToken) =>
            {
                await Task.Delay(TimeSpan.FromMinutes(2), cancellationToken).ConfigureAwait(false);
            });

        Mock<IFindingInspectReadRepository> findings = new();
        findings
            .Setup(f => f.GetInspectAsync(It.IsAny<ScopeContext>(), "f-slow", It.IsAny<CancellationToken>()))
            .ReturnsAsync(Inspect(FindingSeverity.Error, findingId: "f-slow"));

        ScopeContext scope = Scope();
        IntegrationsItsmOutboundOptions options = OutboundJiraConfigured();
        options.Jira.CloudBaseUrl = server.BaseUrl;

        using HttpClient httpForJira = new(new HttpClientHandler());
        httpForJira.Timeout = TimeSpan.FromMilliseconds(800);

        ItsmOutboundIssueCreationService sut = new(
            findings.Object,
            Mock.Of<IItsmFindingCorrelationRepository>(),
            Mock.Of<ITenantItsmOutboundSettingsRepository>(),
            Mock.Of<IRunRepository>(),
            Mock.Of<IArchitectureRequestRepository>(),
            Monitor(options).Object,
            PublicSiteMonitor().Object,
            new JiraOutboundIssueClient(httpForJira, NullLogger<JiraOutboundIssueClient>.Instance),
            ServiceNowClient(new UnexpectedHttpCallMessageHandler()));

        Stopwatch wall = Stopwatch.StartNew();
        ItsmOutboundIssueCreationResult result = await sut.TryCreateForFindingAsync(ItsmOutboundIssueProvider.Jira, scope, "f-slow", CancellationToken.None);
        wall.Stop();

        wall.Elapsed.Should().BeLessThan(TimeSpan.FromSeconds(6));

        result.Kind.Should().Be(ItsmOutboundCreateTerminalKind.VendorError);
        result.VendorStatusCode.Should().Be(503);

        AuditEvent audit = result.AuditEvents.Single();
        audit.EventType.Should().Be(AuditEventTypes.IntegrationJiraIssueCreateFailed);
    }
}
