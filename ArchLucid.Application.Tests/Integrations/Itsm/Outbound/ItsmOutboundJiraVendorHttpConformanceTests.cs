using System.Net;
using System.Text;
using System.Text.Json;

using ArchLucid.Application.Integrations.Itsm.Outbound;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Integrations;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.TestSupport.Connectors;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Application.Tests.Integrations.Itsm.Outbound;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ItsmOutboundJiraVendorHttpConformanceTests
{
    private const string JiraConnectorName = "Jira outbound (ITSM issue create)";

    private static ScopeContext Scope() =>
        new()
        {
            TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
            WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
            ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc")
        };

    private static FindingInspectResponse Inspect(FindingSeverity severity, string findingId = "fid1") =>
        new()
        {
            FindingId = findingId,
            RunId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd"),
            TypedPayload = JsonSerializer.SerializeToElement(
                new ArchitectureFinding { FindingId = findingId, Severity = severity, Message = "Hello" },
                new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase }),
            HumanReviewStatus = FindingHumanReviewStatus.Pending,
            Evidence = [],
            RecommendedActions = []
        };

    private static IntegrationsItsmOutboundOptions OutboundJiraConfigured(string projectKey = "DP") =>
        new()
        {
            Jira = new JiraItsmOutboundOptions
            {
                CloudBaseUrl = "https://example.atlassian.net",
                ServiceAccountEmail = "svc@example.com",
                ApiToken = "token",
                DefaultProjectKey = projectKey
            }
        };

    private static Mock<IOptionsMonitor<IntegrationsItsmOutboundOptions>> Monitor(IntegrationsItsmOutboundOptions o)
    {
        Mock<IOptionsMonitor<IntegrationsItsmOutboundOptions>> m = new();
        m.Setup(x => x.CurrentValue).Returns(o);

        return m;
    }

    private static JiraOutboundIssueClient JiraClient(HttpMessageHandler handler) =>
        new(new HttpClient(handler) { Timeout = TimeSpan.FromSeconds(5) }, NullLogger<JiraOutboundIssueClient>.Instance);

    [Fact]
    public async Task Jira_conformance_when_jira_returns_400_failed_audit_has_status_code()
    {
        StubStatusHandler handler = new(HttpStatusCode.BadRequest, """{"errorMessages":["project missing"]}""");
        Mock<IFindingInspectReadRepository> findings = new();
        findings
            .Setup(f => f.GetInspectAsync(It.IsAny<ScopeContext>(), "x", It.IsAny<CancellationToken>()))
            .ReturnsAsync(Inspect(FindingSeverity.Error, findingId: "x"));

        ScopeContext scope = Scope();

        ItsmOutboundIssueCreationService sut = new(
            findings.Object,
            Mock.Of<IItsmFindingCorrelationRepository>(),
            Mock.Of<ITenantItsmOutboundSettingsRepository>(),
            Mock.Of<IRunRepository>(),
            Mock.Of<IArchitectureRequestRepository>(),
            Monitor(OutboundJiraConfigured()).Object,
            JiraClient(handler),
            new ServiceNowOutboundIncidentClient(new HttpClient(new BoomHandler()), NullLogger<ServiceNowOutboundIncidentClient>.Instance));

        ItsmOutboundIssueCreationResult r = await sut.TryCreateForFindingAsync(
            ItsmOutboundIssueProvider.Jira,
            scope,
            "x",
            CancellationToken.None);

        ItsmOutboundConnectorTestAssertions.AssertClearTerminalOutcome(JiraConnectorName, r, ItsmOutboundCreateTerminalKind.VendorError);
        r.VendorStatusCode.Should().Be(400);
        AuditEvent ev = r.AuditEvents.Single();
        AuditEventOutboundConnectorConformance.AssertScopePreserved(JiraConnectorName, scope, ev);
        ev.DataJson.Should().Contain("400");
    }

    [Fact]
    public async Task Jira_conformance_posts_to_rest_api_3_issue_with_basic_auth_header()
    {
        RecordingHandler handler = new(
            new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent("""{"id":"1","key":"DP-9"}""", Encoding.UTF8, "application/json"),
            });

        Mock<IFindingInspectReadRepository> findings = new();
        findings
            .Setup(f => f.GetInspectAsync(It.IsAny<ScopeContext>(), "x", It.IsAny<CancellationToken>()))
            .ReturnsAsync(Inspect(FindingSeverity.Error, findingId: "x"));

        Mock<IItsmFindingCorrelationRepository> correlations = new();
        correlations
            .Setup(c => c.RegisterAsync(
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                "x",
                "Jira",
                "DP-9",
                "1",
                It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        ScopeContext scope = Scope();

        ItsmOutboundIssueCreationService sut = new(
            findings.Object,
            correlations.Object,
            Mock.Of<ITenantItsmOutboundSettingsRepository>(),
            Mock.Of<IRunRepository>(),
            Mock.Of<IArchitectureRequestRepository>(),
            Monitor(OutboundJiraConfigured()).Object,
            JiraClient(handler),
            new ServiceNowOutboundIncidentClient(new HttpClient(new BoomHandler()), NullLogger<ServiceNowOutboundIncidentClient>.Instance));

        ItsmOutboundIssueCreationResult r = await sut.TryCreateForFindingAsync(
            ItsmOutboundIssueProvider.Jira,
            scope,
            "x",
            CancellationToken.None);

        r.Kind.Should().Be(ItsmOutboundCreateTerminalKind.Succeeded);
        handler.LastRequest.Should().NotBeNull();
        handler.LastRequest!.Method.Should().Be(HttpMethod.Post);
        handler.LastRequest.RequestUri!.AbsolutePath.Should().Be("/rest/api/3/issue");
        handler.LastRequest.Headers.Authorization.Should().NotBeNull();
        handler.LastRequest.Headers.Authorization!.Scheme.Should().Be("Basic");
    }

    private sealed class BoomHandler : HttpMessageHandler
    {
        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken) =>
            Task.FromException<HttpResponseMessage>(new InvalidOperationException("Unexpected HTTP call."));
    }

    private sealed class StubStatusHandler : HttpMessageHandler
    {
        private readonly HttpStatusCode _code;
        private readonly string _body;

        public StubStatusHandler(HttpStatusCode code, string body)
        {
            _code = code;
            _body = body;
        }

        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken) =>
            Task.FromResult(new HttpResponseMessage(_code) { Content = new StringContent(_body, Encoding.UTF8, "application/json") });
    }

    private sealed class RecordingHandler : HttpMessageHandler
    {
        private readonly HttpResponseMessage _response;

        public RecordingHandler(HttpResponseMessage response) => _response = response;

        public HttpRequestMessage? LastRequest { get; private set; }

        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            LastRequest = request;

            return Task.FromResult(_response);
        }
    }
}
