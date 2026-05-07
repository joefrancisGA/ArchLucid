using System.Net;
using System.Text;

using ArchLucid.Application.Integrations.Itsm.Outbound;
using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Integrations;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.TestSupport.Connectors;
using ArchLucid.TestSupport.Http;

using FluentAssertions;

using Moq;

using static ArchLucid.Application.Tests.Integrations.Itsm.Outbound.ItsmOutboundConnectorTestFixture;

namespace ArchLucid.Application.Tests.Integrations.Itsm.Outbound;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ItsmOutboundJiraVendorHttpConformanceTests
{
    private const string JiraConnectorName = "Jira outbound (ITSM issue create)";

    [Fact]
    public async Task Jira_conformance_when_jira_returns_400_failed_audit_has_status_code()
    {
        FixedResponseHttpMessageHandler handler = new(HttpStatusCode.BadRequest, """{"errorMessages":["project missing"]}""");
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
            ServiceNowClient(new UnexpectedHttpCallMessageHandler()));

        ItsmOutboundIssueCreationResult result = await sut.TryCreateForFindingAsync(
            ItsmOutboundIssueProvider.Jira,
            scope,
            "x",
            CancellationToken.None);

        ItsmOutboundConnectorTestAssertions.AssertClearTerminalOutcome(JiraConnectorName, result, ItsmOutboundCreateTerminalKind.VendorError);
        result.VendorStatusCode.Should().Be(400);
        AuditEvent audit = result.AuditEvents.Single();
        AuditEventOutboundConnectorConformance.AssertScopePreserved(JiraConnectorName, scope, audit);
        audit.DataJson.Should().Contain("400");
    }

    [Fact]
    public async Task Jira_conformance_posts_to_rest_api_3_issue_with_basic_auth_header_and_finding_payload()
    {
        RecordingHttpMessageHandler handler = new(
            new HttpResponseMessage(HttpStatusCode.OK) { Content = new StringContent("""{"id":"1","key":"DP-9"}""", Encoding.UTF8, "application/json"), });

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
            ServiceNowClient(new UnexpectedHttpCallMessageHandler()));

        ItsmOutboundIssueCreationResult result = await sut.TryCreateForFindingAsync(
            ItsmOutboundIssueProvider.Jira,
            scope,
            "x",
            CancellationToken.None);

        result.Kind.Should().Be(ItsmOutboundCreateTerminalKind.Succeeded);
        handler.LastRequest.Should().NotBeNull();
        handler.LastRequest!.Method.Should().Be(HttpMethod.Post);
        handler.LastRequest.RequestUri!.AbsolutePath.Should().Be("/rest/api/3/issue");
        AssertBasicAuthPresent(handler.LastRequest);
        handler.LastRequestBody.Should().NotBeNullOrWhiteSpace();
        handler.LastRequestBody.Should().Contain("\"key\":\"DP\"", "Project key comes from configured default.");
        handler.LastRequestBody.Should().Contain("Hello", "Summary should embed ArchitectureFinding message per mapper.");
        handler.LastRequestBody.Should().Contain("findingId", "Description must retain correlation paths from authority shape.");
    }

    [Fact]
    public async Task Jira_conformance_when_transport_fails_vendor_error_without_live_call()
    {
        FaultingHttpMessageHandler handler = new(new HttpRequestException("simulated network failure"));
        Mock<IFindingInspectReadRepository> findings = new();
        findings
            .Setup(f => f.GetInspectAsync(It.IsAny<ScopeContext>(), "x", It.IsAny<CancellationToken>()))
            .ReturnsAsync(Inspect(FindingSeverity.Warning, findingId: "x"));

        ItsmOutboundIssueCreationService sut = new(
            findings.Object,
            Mock.Of<IItsmFindingCorrelationRepository>(),
            Mock.Of<ITenantItsmOutboundSettingsRepository>(),
            Mock.Of<IRunRepository>(),
            Mock.Of<IArchitectureRequestRepository>(),
            Monitor(OutboundJiraConfigured()).Object,
            JiraClient(handler),
            ServiceNowClient(new UnexpectedHttpCallMessageHandler()));

        ItsmOutboundIssueCreationResult result = await sut.TryCreateForFindingAsync(
            ItsmOutboundIssueProvider.Jira,
            Scope(),
            "x",
            CancellationToken.None);

        ItsmOutboundConnectorTestAssertions.AssertClearTerminalOutcome(JiraConnectorName, result, ItsmOutboundCreateTerminalKind.VendorError);
        result.UserMessage.Should().Contain("network");
        result.VendorStatusCode.Should().Be(503);
    }
}
