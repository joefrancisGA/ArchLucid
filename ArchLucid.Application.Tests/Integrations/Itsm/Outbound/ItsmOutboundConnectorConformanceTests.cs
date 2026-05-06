using System.Text.Json;

using ArchLucid.Application.Integrations.Itsm.Outbound;
using ArchLucid.Contracts.Findings;
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
public sealed class ItsmOutboundConnectorConformanceTests
{
    private const string JiraConnectorName = "Jira outbound (ITSM issue create)";

    private const string ServiceNowConnectorName = "ServiceNow outbound (ITSM incident create)";

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
    public async Task Jira_conformance_when_credentials_missing_skipped_audit_preserves_scope_and_excludes_secrets()
    {
        HttpMessageHandler boom = new BoomHttpMessageHandler();
        Mock<IFindingInspectReadRepository> findings = new();
        findings
            .Setup(f => f.GetInspectAsync(It.IsAny<ScopeContext>(), "x", It.IsAny<CancellationToken>()))
            .ReturnsAsync(Inspect(FindingSeverity.Error, findingId: "x"));

        ScopeContext scope = Scope();
        IntegrationsItsmOutboundOptions outbound = OutboundJiraConfigured();
        outbound.Jira = new JiraItsmOutboundOptions { CloudBaseUrl = "", ServiceAccountEmail = "", ApiToken = "" };

        ItsmOutboundIssueCreationService sut = new(
            findings.Object,
            Mock.Of<IItsmFindingCorrelationRepository>(),
            Mock.Of<ITenantItsmOutboundSettingsRepository>(),
            Mock.Of<IRunRepository>(),
            Mock.Of<IArchitectureRequestRepository>(),
            Monitor(outbound).Object,
            JiraClient(boom),
            new ServiceNowOutboundIncidentClient(new HttpClient(boom), NullLogger<ServiceNowOutboundIncidentClient>.Instance));

        ItsmOutboundIssueCreationResult r = await sut.TryCreateForFindingAsync(
            ItsmOutboundIssueProvider.Jira,
            scope,
            "x",
            CancellationToken.None);

        ItsmOutboundConnectorTestAssertions.AssertClearTerminalOutcome(JiraConnectorName, r, ItsmOutboundCreateTerminalKind.Skipped);
        AuditEvent ev = r.AuditEvents.Single();

        AuditEventOutboundConnectorConformance.AssertScopePreserved(JiraConnectorName, scope, ev);
        AuditEventOutboundConnectorConformance.AssertAuditDataExcludesSecretMaterial(JiraConnectorName, ev.DataJson);
        AuditEventOutboundConnectorConformance.AssertAuditDataContainsFindingIdWhenPresent(JiraConnectorName, "x", ev.DataJson);
    }

    [Fact]
    public async Task Jira_conformance_when_finding_missing_failed_audit_preserves_scope()
    {
        HttpMessageHandler boom = new BoomHttpMessageHandler();
        Mock<IFindingInspectReadRepository> findings = new();
        findings
            .Setup(f => f.GetInspectAsync(It.IsAny<ScopeContext>(), "missing", It.IsAny<CancellationToken>()))
            .ReturnsAsync((FindingInspectResponse?)null);

        ScopeContext scope = Scope();

        ItsmOutboundIssueCreationService sut = new(
            findings.Object,
            Mock.Of<IItsmFindingCorrelationRepository>(),
            Mock.Of<ITenantItsmOutboundSettingsRepository>(),
            Mock.Of<IRunRepository>(),
            Mock.Of<IArchitectureRequestRepository>(),
            Monitor(OutboundJiraConfigured()).Object,
            JiraClient(boom),
            new ServiceNowOutboundIncidentClient(new HttpClient(boom), NullLogger<ServiceNowOutboundIncidentClient>.Instance));

        ItsmOutboundIssueCreationResult r = await sut.TryCreateForFindingAsync(
            ItsmOutboundIssueProvider.Jira,
            scope,
            "missing",
            CancellationToken.None);

        ItsmOutboundConnectorTestAssertions.AssertClearTerminalOutcome(JiraConnectorName, r, ItsmOutboundCreateTerminalKind.VendorError);
        AuditEvent ev = r.AuditEvents.Single();

        AuditEventOutboundConnectorConformance.AssertScopePreserved(JiraConnectorName, scope, ev);
        AuditEventOutboundConnectorConformance.AssertAuditDataExcludesSecretMaterial(JiraConnectorName, ev.DataJson);
    }

    [Fact]
    public async Task ServiceNow_conformance_when_credentials_missing_skipped_audit_preserves_scope()
    {
        HttpMessageHandler boom = new BoomHttpMessageHandler();
        Mock<IFindingInspectReadRepository> findings = new();
        findings
            .Setup(f => f.GetInspectAsync(It.IsAny<ScopeContext>(), "f1", It.IsAny<CancellationToken>()))
            .ReturnsAsync(Inspect(FindingSeverity.Warning, findingId: "f1"));

        ScopeContext scope = Scope();
        IntegrationsItsmOutboundOptions outbound = OutboundJiraConfigured();
        outbound.ServiceNow = new ServiceNowItsmOutboundOptions
        {
            InstanceBaseUrl = string.Empty,
            Username = string.Empty,
            Password = string.Empty
        };

        ItsmOutboundIssueCreationService sut = new(
            findings.Object,
            Mock.Of<IItsmFindingCorrelationRepository>(),
            Mock.Of<ITenantItsmOutboundSettingsRepository>(),
            Mock.Of<IRunRepository>(),
            Mock.Of<IArchitectureRequestRepository>(),
            Monitor(outbound).Object,
            new JiraOutboundIssueClient(new HttpClient(boom), NullLogger<JiraOutboundIssueClient>.Instance),
            new ServiceNowOutboundIncidentClient(new HttpClient(boom), NullLogger<ServiceNowOutboundIncidentClient>.Instance));

        ItsmOutboundIssueCreationResult r = await sut.TryCreateForFindingAsync(
            ItsmOutboundIssueProvider.ServiceNow,
            scope,
            "f1",
            CancellationToken.None);

        ItsmOutboundConnectorTestAssertions.AssertClearTerminalOutcome(
            ServiceNowConnectorName,
            r,
            ItsmOutboundCreateTerminalKind.Skipped);

        AuditEvent ev = r.AuditEvents.Single();

        AuditEventOutboundConnectorConformance.AssertScopePreserved(ServiceNowConnectorName, scope, ev);
        AuditEventOutboundConnectorConformance.AssertAuditDataExcludesSecretMaterial(ServiceNowConnectorName, ev.DataJson);
        AuditEventOutboundConnectorConformance.AssertAuditDataContainsFindingIdWhenPresent(ServiceNowConnectorName, "f1", ev.DataJson);
    }

    private sealed class BoomHttpMessageHandler : HttpMessageHandler
    {
        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken) =>
            Task.FromException<HttpResponseMessage>(new InvalidOperationException("Unexpected HTTP call."));
    }
}
