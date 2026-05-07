using ArchLucid.Application.Integrations.Itsm.Outbound;
using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Integrations;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.TestSupport.Connectors;
using ArchLucid.TestSupport.Http;

using FluentAssertions;

using Microsoft.Extensions.Options;

using Moq;

using static ArchLucid.Application.Tests.Integrations.Itsm.Outbound.ItsmOutboundConnectorTestFixture;

namespace ArchLucid.Application.Tests.Integrations.Itsm.Outbound;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ItsmOutboundConnectorConformanceTests
{
    private const string JiraConnectorName = "Jira outbound (ITSM issue create)";

    private const string ServiceNowConnectorName = "ServiceNow outbound (ITSM incident create)";

    [Fact]
    public async Task Jira_conformance_when_credentials_missing_skipped_audit_preserves_scope_and_excludes_secrets()
    {
        HttpMessageHandler boom = new UnexpectedHttpCallMessageHandler();
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
            ServiceNowClient(boom));

        ItsmOutboundIssueCreationResult result = await sut.TryCreateForFindingAsync(
            ItsmOutboundIssueProvider.Jira,
            scope,
            "x",
            CancellationToken.None);

        ItsmOutboundConnectorTestAssertions.AssertClearTerminalOutcome(JiraConnectorName, result, ItsmOutboundCreateTerminalKind.Skipped);
        AuditEvent audit = result.AuditEvents.Single();

        AuditEventOutboundConnectorConformance.AssertScopePreserved(JiraConnectorName, scope, audit);
        AuditEventOutboundConnectorConformance.AssertAuditDataExcludesSecretMaterial(JiraConnectorName, audit.DataJson);
        AuditEventOutboundConnectorConformance.AssertAuditDataContainsFindingIdWhenPresent(JiraConnectorName, "x", audit.DataJson);
    }

    [Fact]
    public async Task Jira_conformance_when_finding_missing_failed_audit_preserves_scope()
    {
        HttpMessageHandler boom = new UnexpectedHttpCallMessageHandler();
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
            ServiceNowClient(boom));

        ItsmOutboundIssueCreationResult result = await sut.TryCreateForFindingAsync(
            ItsmOutboundIssueProvider.Jira,
            scope,
            "missing",
            CancellationToken.None);

        ItsmOutboundConnectorTestAssertions.AssertClearTerminalOutcome(JiraConnectorName, result, ItsmOutboundCreateTerminalKind.VendorError);
        AuditEvent audit = result.AuditEvents.Single();

        AuditEventOutboundConnectorConformance.AssertScopePreserved(JiraConnectorName, scope, audit);
        AuditEventOutboundConnectorConformance.AssertAuditDataExcludesSecretMaterial(JiraConnectorName, audit.DataJson);
    }

    [Fact]
    public async Task ServiceNow_conformance_when_credentials_missing_skipped_audit_preserves_scope()
    {
        HttpMessageHandler boom = new UnexpectedHttpCallMessageHandler();
        Mock<IFindingInspectReadRepository> findings = new();
        findings
            .Setup(f => f.GetInspectAsync(It.IsAny<ScopeContext>(), "f1", It.IsAny<CancellationToken>()))
            .ReturnsAsync(Inspect(FindingSeverity.Warning, findingId: "f1"));

        ScopeContext scope = Scope();
        IntegrationsItsmOutboundOptions outbound = OutboundJiraConfigured();
        outbound.ServiceNow = new ServiceNowItsmOutboundOptions { InstanceBaseUrl = string.Empty, Username = string.Empty, Password = string.Empty };

        ItsmOutboundIssueCreationService sut = new(
            findings.Object,
            Mock.Of<IItsmFindingCorrelationRepository>(),
            Mock.Of<ITenantItsmOutboundSettingsRepository>(),
            Mock.Of<IRunRepository>(),
            Mock.Of<IArchitectureRequestRepository>(),
            Monitor(outbound).Object,
            JiraClient(boom),
            ServiceNowClient(boom));

        ItsmOutboundIssueCreationResult result = await sut.TryCreateForFindingAsync(
            ItsmOutboundIssueProvider.ServiceNow,
            scope,
            "f1",
            CancellationToken.None);

        ItsmOutboundConnectorTestAssertions.AssertClearTerminalOutcome(
            ServiceNowConnectorName,
            result,
            ItsmOutboundCreateTerminalKind.Skipped);

        AuditEvent audit = result.AuditEvents.Single();

        AuditEventOutboundConnectorConformance.AssertScopePreserved(ServiceNowConnectorName, scope, audit);
        AuditEventOutboundConnectorConformance.AssertAuditDataExcludesSecretMaterial(ServiceNowConnectorName, audit.DataJson);
        AuditEventOutboundConnectorConformance.AssertAuditDataContainsFindingIdWhenPresent(ServiceNowConnectorName, "f1", audit.DataJson);
    }
}
