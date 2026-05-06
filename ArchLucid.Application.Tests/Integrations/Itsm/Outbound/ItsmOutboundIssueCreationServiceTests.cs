using System.Net;
using System.Text;
using System.Text.Json;

using ArchLucid.Application.Integrations.Itsm.Outbound;
using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Integrations;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Application.Tests.Integrations.Itsm.Outbound;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ItsmOutboundIssueCreationServiceTests
{
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
                options: new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase }),
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
    public async Task Jira_when_project_key_missing_does_not_call_http_or_correlation()
    {
        HttpMessageHandler boom = new BoomHttpMessageHandler();
        Mock<IFindingInspectReadRepository> findings = new();
        findings
            .Setup(f => f.GetInspectAsync(It.IsAny<ScopeContext>(), "x", It.IsAny<CancellationToken>()))
            .ReturnsAsync(Inspect(FindingSeverity.Error));

        Mock<IItsmFindingCorrelationRepository> correlations = new();

        ItsmOutboundIssueCreationService sut = new(
            findings.Object,
            correlations.Object,
            Mock.Of<ITenantItsmOutboundSettingsRepository>(t =>
                t.TryGetAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()) == Task.FromResult<TenantItsmOutboundSettings?>(null)),
            Mock.Of<IRunRepository>(),
            Mock.Of<IArchitectureRequestRepository>(),
            Monitor(OutboundJiraConfigured(projectKey: "   ")).Object,
            JiraClient(boom),
            new ServiceNowOutboundIncidentClient(new HttpClient(boom), NullLogger<ServiceNowOutboundIncidentClient>.Instance));

        ItsmOutboundIssueCreationResult r = await sut.TryCreateForFindingAsync(
            ItsmOutboundIssueProvider.Jira,
            Scope(),
            "x",
            CancellationToken.None);

        r.Kind.Should().Be(ItsmOutboundCreateTerminalKind.Skipped);
        r.UserMessage.Should().Contain("project key");
        correlations.Verify(
            c => c.RegisterAsync(It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<string>(), It.IsAny<string>(),
                It.IsAny<string>(), It.IsAny<string?>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task Jira_Info_severity_dropped_when_sendInfo_false()
    {
        HttpMessageHandler boom = new BoomHttpMessageHandler();
        Mock<IFindingInspectReadRepository> findings = new();
        findings
            .Setup(f => f.GetInspectAsync(It.IsAny<ScopeContext>(), "x", It.IsAny<CancellationToken>()))
            .ReturnsAsync(Inspect(FindingSeverity.Info));

        Mock<IItsmFindingCorrelationRepository> correlations = new();

        ItsmOutboundIssueCreationService sut = new(
            findings.Object,
            correlations.Object,
            Mock.Of<ITenantItsmOutboundSettingsRepository>(),
            Mock.Of<IRunRepository>(),
            Mock.Of<IArchitectureRequestRepository>(),
            Monitor(OutboundJiraConfigured()).Object,
            JiraClient(boom),
            new ServiceNowOutboundIncidentClient(new HttpClient(boom), NullLogger<ServiceNowOutboundIncidentClient>.Instance));

        ItsmOutboundIssueCreationResult r = await sut.TryCreateForFindingAsync(
            ItsmOutboundIssueProvider.Jira,
            Scope(),
            "x",
            CancellationToken.None);

        r.Kind.Should().Be(ItsmOutboundCreateTerminalKind.Skipped);
        correlations.Verify(
            c => c.RegisterAsync(It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<string>(), It.IsAny<string>(),
                It.IsAny<string>(), It.IsAny<string?>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task Jira_Info_severity_creates_at_Low_when_sendInfo_true()
    {
        RecordingHandler handler = new(
            _ => new HttpResponseMessage(HttpStatusCode.Created)
            {
                Content = new StringContent("{\"id\":\"9\",\"key\":\"DP-42\"}", Encoding.UTF8, "application/json")
            });

        Mock<IFindingInspectReadRepository> findings = new();
        findings
            .Setup(f => f.GetInspectAsync(It.IsAny<ScopeContext>(), "x", It.IsAny<CancellationToken>()))
            .ReturnsAsync(Inspect(FindingSeverity.Info));

        Mock<IItsmFindingCorrelationRepository> correlations = new();
        correlations
            .Setup(c => c.RegisterAsync(
                    It.IsAny<Guid>(),
                    It.IsAny<Guid>(),
                    It.IsAny<Guid>(),
                    "x",
                    "Jira",
                    "DP-42",
                    "9",
                    It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        Mock<ITenantItsmOutboundSettingsRepository> tenant = new();
        tenant
            .Setup(t => t.TryGetAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new TenantItsmOutboundSettings { JiraSendInfoSeverity = true });

        ItsmOutboundIssueCreationService sut = new(
            findings.Object,
            correlations.Object,
            tenant.Object,
            Mock.Of<IRunRepository>(),
            Mock.Of<IArchitectureRequestRepository>(),
            Monitor(OutboundJiraConfigured()).Object,
            JiraClient(handler),
            new ServiceNowOutboundIncidentClient(new HttpClient(new BoomHttpMessageHandler()),
                NullLogger<ServiceNowOutboundIncidentClient>.Instance));

        ItsmOutboundIssueCreationResult r = await sut.TryCreateForFindingAsync(
            ItsmOutboundIssueProvider.Jira,
            Scope(),
            "x",
            CancellationToken.None);

        r.Kind.Should().Be(ItsmOutboundCreateTerminalKind.Succeeded);
        handler.RequestCount.Should().Be(1);
        string body = handler.LastBody!;
        body.Should().Contain("\"name\":\"Low\"");
    }

    [Fact]
    public async Task Jira_registers_correlation_on_success()
    {
        RecordingHandler handler = new(
            _ => new HttpResponseMessage(HttpStatusCode.Created)
            {
                Content = new StringContent("{\"id\":\"9\",\"key\":\"DP-99\"}", Encoding.UTF8, "application/json")
            });

        Mock<IFindingInspectReadRepository> findings = new();
        findings
            .Setup(f => f.GetInspectAsync(It.IsAny<ScopeContext>(), "x", It.IsAny<CancellationToken>()))
            .ReturnsAsync(Inspect(FindingSeverity.Critical, "x"));

        Mock<IItsmFindingCorrelationRepository> correlations = new();

        ItsmOutboundIssueCreationService sut = new(
            findings.Object,
            correlations.Object,
            Mock.Of<ITenantItsmOutboundSettingsRepository>(),
            Mock.Of<IRunRepository>(),
            Mock.Of<IArchitectureRequestRepository>(),
            Monitor(OutboundJiraConfigured()).Object,
            JiraClient(handler),
            new ServiceNowOutboundIncidentClient(new HttpClient(new BoomHttpMessageHandler()),
                NullLogger<ServiceNowOutboundIncidentClient>.Instance));

        ItsmOutboundIssueCreationResult r = await sut.TryCreateForFindingAsync(
            ItsmOutboundIssueProvider.Jira,
            Scope(),
            "x",
            CancellationToken.None);

        r.Kind.Should().Be(ItsmOutboundCreateTerminalKind.Succeeded);
        correlations.Verify(
            c => c.RegisterAsync(
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                "x",
                "Jira",
                "DP-99",
                "9",
                It.IsAny<CancellationToken>()),
            Times.Once);
        handler.LastBody.Should().Contain("\"name\":\"Blocker\"");
    }

    [Theory]
    [InlineData(HttpStatusCode.Unauthorized)]
    [InlineData(HttpStatusCode.Forbidden)]
    [InlineData(HttpStatusCode.NotFound)]
    [InlineData(HttpStatusCode.TooManyRequests)]
    [InlineData(HttpStatusCode.InternalServerError)]
    public async Task Jira_vendor_errors_surface_as_vendor_terminal(HttpStatusCode code)
    {
        RecordingHandler handler = new(
            _ => new HttpResponseMessage(code)
            {
                Content = new StringContent("{}", Encoding.UTF8, "application/json")
            });

        Mock<IFindingInspectReadRepository> findings = new();
        findings
            .Setup(f => f.GetInspectAsync(It.IsAny<ScopeContext>(), "x", It.IsAny<CancellationToken>()))
            .ReturnsAsync(Inspect(FindingSeverity.Warning));

        ItsmOutboundIssueCreationService sut = new(
            findings.Object,
            Mock.Of<IItsmFindingCorrelationRepository>(),
            Mock.Of<ITenantItsmOutboundSettingsRepository>(),
            Mock.Of<IRunRepository>(),
            Mock.Of<IArchitectureRequestRepository>(),
            Monitor(OutboundJiraConfigured()).Object,
            JiraClient(handler),
            new ServiceNowOutboundIncidentClient(new HttpClient(new BoomHttpMessageHandler()),
                NullLogger<ServiceNowOutboundIncidentClient>.Instance));

        ItsmOutboundIssueCreationResult r = await sut.TryCreateForFindingAsync(
            ItsmOutboundIssueProvider.Jira,
            Scope(),
            "x",
            CancellationToken.None);

        r.Kind.Should().Be(ItsmOutboundCreateTerminalKind.VendorError);
        r.VendorStatusCode.Should().Be((int)code);
    }

    [Fact]
    public async Task Jira_malformed_success_response_is_vendor_error()
    {
        RecordingHandler handler = new(
            _ => new HttpResponseMessage(HttpStatusCode.Created)
            {
                Content = new StringContent("{\"id\":\"9\"}", Encoding.UTF8, "application/json")
            });

        Mock<IFindingInspectReadRepository> findings = new();
        findings
            .Setup(f => f.GetInspectAsync(It.IsAny<ScopeContext>(), "x", It.IsAny<CancellationToken>()))
            .ReturnsAsync(Inspect(FindingSeverity.Error));

        ItsmOutboundIssueCreationService sut = new(
            findings.Object,
            Mock.Of<IItsmFindingCorrelationRepository>(),
            Mock.Of<ITenantItsmOutboundSettingsRepository>(),
            Mock.Of<IRunRepository>(),
            Mock.Of<IArchitectureRequestRepository>(),
            Monitor(OutboundJiraConfigured()).Object,
            JiraClient(handler),
            new ServiceNowOutboundIncidentClient(new HttpClient(new BoomHttpMessageHandler()),
                NullLogger<ServiceNowOutboundIncidentClient>.Instance));

        ItsmOutboundIssueCreationResult r = await sut.TryCreateForFindingAsync(
            ItsmOutboundIssueProvider.Jira,
            Scope(),
            "x",
            CancellationToken.None);

        r.Kind.Should().Be(ItsmOutboundCreateTerminalKind.VendorError);
    }

    [Fact]
    public async Task Jira_correlation_persistence_failure_is_reported()
    {
        RecordingHandler handler = new(
            _ => new HttpResponseMessage(HttpStatusCode.Created)
            {
                Content = new StringContent("{\"id\":\"9\",\"key\":\"DP-1\"}", Encoding.UTF8, "application/json")
            });

        Mock<IFindingInspectReadRepository> findings = new();
        findings
            .Setup(x => x.GetInspectAsync(It.IsAny<ScopeContext>(), "x", It.IsAny<CancellationToken>()))
            .ReturnsAsync(Inspect(FindingSeverity.Warning));

        Mock<IItsmFindingCorrelationRepository> correlations = new();
        correlations
            .Setup(c => c.RegisterAsync(
                    It.IsAny<Guid>(),
                    It.IsAny<Guid>(),
                    It.IsAny<Guid>(),
                    It.IsAny<string>(),
                    It.IsAny<string>(),
                    It.IsAny<string>(),
                    It.IsAny<string?>(),
                    It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("sql down"));

        ItsmOutboundIssueCreationService sut = new(
            findings.Object,
            correlations.Object,
            Mock.Of<ITenantItsmOutboundSettingsRepository>(),
            Mock.Of<IRunRepository>(),
            Mock.Of<IArchitectureRequestRepository>(),
            Monitor(OutboundJiraConfigured()).Object,
            JiraClient(handler),
            new ServiceNowOutboundIncidentClient(new HttpClient(new BoomHttpMessageHandler()),
                NullLogger<ServiceNowOutboundIncidentClient>.Instance));

        ItsmOutboundIssueCreationResult r = await sut.TryCreateForFindingAsync(
            ItsmOutboundIssueProvider.Jira,
            Scope(),
            "x",
            CancellationToken.None);

        r.Kind.Should().Be(ItsmOutboundCreateTerminalKind.CorrelationPersistenceFailed);
        r.ExternalKey.Should().Be("DP-1");
    }

    [Fact]
    public async Task ServiceNow_happy_path_persists_correlation_by_sys_id()
    {
        Guid runId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");
        RecordingHandler handler = new(request =>
        {
            if (request.RequestUri!.AbsolutePath.Contains("cmdb_ci_appl", StringComparison.Ordinal))
                return new HttpResponseMessage(HttpStatusCode.OK)
                {
                    Content = new StringContent("{\"result\":[]}", Encoding.UTF8, "application/json")
                };

            return new HttpResponseMessage(HttpStatusCode.Created)
            {
                Content = new StringContent(
                    "{\"result\":{\"sys_id\":\"sys-1\",\"number\":\"INC9\"}}",
                    Encoding.UTF8,
                    "application/json")
            };
        });

        Mock<IFindingInspectReadRepository> findings = new();
        findings
            .Setup(f => f.GetInspectAsync(It.IsAny<ScopeContext>(), "f1", It.IsAny<CancellationToken>()))
            .ReturnsAsync(
                new FindingInspectResponse
                {
                    FindingId = "f1",
                    RunId = runId,
                    TypedPayload = JsonSerializer.SerializeToElement(
                        new ArchitectureFinding { Severity = FindingSeverity.Critical, Message = "Z" },
                        new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase }),
                    HumanReviewStatus = FindingHumanReviewStatus.Pending,
                    Evidence = [],
                    RecommendedActions = []
                });

        Mock<IRunRepository> runs = new();
        runs
            .Setup(r => r.GetByIdAsync(It.IsAny<ScopeContext>(), runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RunRecord { ArchitectureRequestId = null });

        Mock<IItsmFindingCorrelationRepository> correlations = new();

        IntegrationsItsmOutboundOptions outbound = OutboundJiraConfigured();
        outbound.ServiceNow = new ServiceNowItsmOutboundOptions
        {
            InstanceBaseUrl = "https://sn.example",
            Username = "u",
            Password = "p"
        };

        ItsmOutboundIssueCreationService sut = new(
            findings.Object,
            correlations.Object,
            Mock.Of<ITenantItsmOutboundSettingsRepository>(),
            runs.Object,
            Mock.Of<IArchitectureRequestRepository>(),
            Monitor(outbound).Object,
            new JiraOutboundIssueClient(new HttpClient(new BoomHttpMessageHandler()), NullLogger<JiraOutboundIssueClient>.Instance),
            new ServiceNowOutboundIncidentClient(new HttpClient(handler), NullLogger<ServiceNowOutboundIncidentClient>.Instance));

        ItsmOutboundIssueCreationResult r = await sut.TryCreateForFindingAsync(
            ItsmOutboundIssueProvider.ServiceNow,
            Scope(),
            "f1",
            CancellationToken.None);

        r.Kind.Should().Be(ItsmOutboundCreateTerminalKind.Succeeded);
        correlations.Verify(
            c => c.RegisterAsync(
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                "f1",
                "ServiceNow",
                "sys-1",
                "INC9",
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    private sealed class BoomHttpMessageHandler : HttpMessageHandler
    {
        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken) =>
            Task.FromException<HttpResponseMessage>(new InvalidOperationException("Unexpected HTTP call."));
    }

    private sealed class RecordingHandler : HttpMessageHandler
    {
        private readonly Func<HttpRequestMessage, HttpResponseMessage> _onRequest;
        internal int RequestCount;
        internal string? LastBody;

        public RecordingHandler(Func<HttpRequestMessage, HttpResponseMessage> onRequest)
        {
            _onRequest = onRequest;
        }

        protected override async Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            RequestCount++;
            LastBody = request.Content is null ? null : await request.Content.ReadAsStringAsync(cancellationToken);

            return _onRequest(request);
        }
    }
}
