using System.Net;
using System.Text;
using System.Text.Json;

using ArchLucid.Application.Integrations.Itsm.Outbound;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Integrations;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;
using ArchLucid.TestSupport.Connectors;
using ArchLucid.TestSupport.Http;

using FluentAssertions;

using Moq;

using static ArchLucid.Application.Tests.Integrations.Itsm.Outbound.ItsmOutboundConnectorTestFixture;

namespace ArchLucid.Application.Tests.Integrations.Itsm.Outbound;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ItsmOutboundServiceNowVendorHttpConformanceTests
{
    private const string ConnectorName = "ServiceNow outbound (ITSM incident create)";

    [Fact]
    public async Task ServiceNow_conformance_posts_incident_with_basic_auth_and_authority_shaped_payload()
    {
        Guid runId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");
        RecordingHttpMessageHandler handler = new(request =>
        {
            if (request.RequestUri!.AbsolutePath.Contains("cmdb_ci_appl", StringComparison.Ordinal))
                return new HttpResponseMessage(HttpStatusCode.OK) { Content = new StringContent("{\"result\":[]}", Encoding.UTF8, "application/json") };

            return new HttpResponseMessage(HttpStatusCode.Created)
            {
                Content = new StringContent(
                    "{\"result\":{\"sys_id\":\"sys-1\",\"number\":\"INC42\"}}",
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
                    Severity = FindingSeverity.Critical,
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
        correlations
            .Setup(c => c.RegisterAsync(
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                "f1",
                "ServiceNow",
                "sys-1",
                "INC42",
                It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        ScopeContext scope = Scope();
        ItsmOutboundIssueCreationService sut = new(
            findings.Object,
            correlations.Object,
            Mock.Of<ITenantItsmOutboundSettingsRepository>(),
            runs.Object,
            Mock.Of<IArchitectureRequestRepository>(),
            Monitor(OutboundServiceNowConfigured()).Object,
            PublicSiteMonitor().Object,
            JiraClient(new UnexpectedHttpCallMessageHandler()),
            ServiceNowClient(handler));

        ItsmOutboundIssueCreationResult result = await sut.TryCreateForFindingAsync(
            ItsmOutboundIssueProvider.ServiceNow,
            scope,
            "f1",
            CancellationToken.None);

        ItsmOutboundConnectorTestAssertions.AssertClearTerminalOutcome(
            ConnectorName,
            result,
            ItsmOutboundCreateTerminalKind.Succeeded);

        HttpRequestMessage? incidentRequest = handler.LastRequest;
        incidentRequest.Should().NotBeNull();
        incidentRequest.Method.Should().Be(HttpMethod.Post);
        incidentRequest.RequestUri!.ToString().Should().Contain("/api/now/table/incident");
        AssertBasicAuthPresent(incidentRequest);

        string? body = handler.LastRequestBody;
        body.Should().NotBeNullOrWhiteSpace();
        body.Should().Contain("short_description", "ServiceNow Table API uses snake_case field names.");
        body.Should().Contain("description");
        body.Should().Contain("urgency");
        body.Should().Contain("impact");
        body.Should().Contain("Z", "Summary/description must embed authority finding text, not a parallel schema.");

        AuditEvent audit = result.AuditEvents.Single();
        AuditEventOutboundConnectorConformance.AssertScopePreserved(ConnectorName, scope, audit);
        AuditEventOutboundConnectorConformance.AssertAuditDataExcludesSecretMaterial(ConnectorName, audit.DataJson);
    }

    [Fact]
    public async Task ServiceNow_conformance_when_incident_returns_400_failed_audit_has_status_code()
    {
        Guid runId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");
        RecordingHttpMessageHandler handler = new(request =>
        {
            if (request.RequestUri!.AbsolutePath.Contains("cmdb_ci_appl", StringComparison.Ordinal))
                return new HttpResponseMessage(HttpStatusCode.OK) { Content = new StringContent("{\"result\":[]}", Encoding.UTF8, "application/json") };

            return new HttpResponseMessage(HttpStatusCode.BadRequest)
            {
                Content = new StringContent("{\"error\":\"validation\"}", Encoding.UTF8, "application/json")
            };
        });

        Mock<IFindingInspectReadRepository> findings = new();
        findings
            .Setup(f => f.GetInspectAsync(It.IsAny<ScopeContext>(), "f1", It.IsAny<CancellationToken>()))
            .ReturnsAsync(Inspect(FindingSeverity.Warning, findingId: "f1"));

        Mock<IRunRepository> runs = new();
        runs
            .Setup(r => r.GetByIdAsync(It.IsAny<ScopeContext>(), runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RunRecord { ArchitectureRequestId = null });

        ScopeContext scope = Scope();
        ItsmOutboundIssueCreationService sut = new(
            findings.Object,
            Mock.Of<IItsmFindingCorrelationRepository>(),
            Mock.Of<ITenantItsmOutboundSettingsRepository>(),
            runs.Object,
            Mock.Of<IArchitectureRequestRepository>(),
            Monitor(OutboundServiceNowConfigured()).Object,
            PublicSiteMonitor().Object,
            JiraClient(new UnexpectedHttpCallMessageHandler()),
            ServiceNowClient(handler));

        ItsmOutboundIssueCreationResult result = await sut.TryCreateForFindingAsync(
            ItsmOutboundIssueProvider.ServiceNow,
            scope,
            "f1",
            CancellationToken.None);

        ItsmOutboundConnectorTestAssertions.AssertClearTerminalOutcome(
            ConnectorName,
            result,
            ItsmOutboundCreateTerminalKind.VendorError);

        result.VendorStatusCode.Should().Be(400);
        AuditEvent audit = result.AuditEvents.Single();
        AuditEventOutboundConnectorConformance.AssertScopePreserved(ConnectorName, scope, audit);
        audit.DataJson.Should().Contain("400");
    }

    [Fact]
    public async Task ServiceNow_conformance_when_incident_transport_fails_vendor_error_without_live_call()
    {
        Guid runId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");
        FaultingHttpMessageHandler handler = new(new HttpRequestException("simulated network failure"));

        Mock<IFindingInspectReadRepository> findings = new();
        findings
            .Setup(f => f.GetInspectAsync(It.IsAny<ScopeContext>(), "f1", It.IsAny<CancellationToken>()))
            .ReturnsAsync(Inspect(FindingSeverity.Error, findingId: "f1"));

        Mock<IRunRepository> runs = new();
        runs
            .Setup(r => r.GetByIdAsync(It.IsAny<ScopeContext>(), runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RunRecord { ArchitectureRequestId = null });

        ScopeContext scope = Scope();
        ItsmOutboundIssueCreationService sut = new(
            findings.Object,
            Mock.Of<IItsmFindingCorrelationRepository>(),
            Mock.Of<ITenantItsmOutboundSettingsRepository>(),
            runs.Object,
            Mock.Of<IArchitectureRequestRepository>(),
            Monitor(OutboundServiceNowConfigured()).Object,
            PublicSiteMonitor().Object,
            JiraClient(new UnexpectedHttpCallMessageHandler()),
            ServiceNowClient(handler));

        ItsmOutboundIssueCreationResult result = await sut.TryCreateForFindingAsync(
            ItsmOutboundIssueProvider.ServiceNow,
            scope,
            "f1",
            CancellationToken.None);

        ItsmOutboundConnectorTestAssertions.AssertClearTerminalOutcome(
            ConnectorName,
            result,
            ItsmOutboundCreateTerminalKind.VendorError);

        result.UserMessage.Should().Contain("network", because: "operators need a transport-failure hint.");
        result.VendorStatusCode.Should().Be(503);
    }

    [Fact]
    public async Task ServiceNow_conformance_when_cmdb_lookup_forbidden_failed_audit_preserves_scope()
    {
        Guid runId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");
        RecordingHttpMessageHandler handler = new(request =>
        {
            if (request.RequestUri!.AbsolutePath.Contains("cmdb_ci_appl", StringComparison.Ordinal))
                return new HttpResponseMessage(HttpStatusCode.Forbidden)
                {
                    Content = new StringContent("{\"error\":\"acl\"}", Encoding.UTF8, "application/json")
                };

            return new HttpResponseMessage(HttpStatusCode.OK) { Content = new StringContent("{\"result\":[]}", Encoding.UTF8, "application/json") };
        });

        Mock<IFindingInspectReadRepository> findings = new();
        findings
            .Setup(f => f.GetInspectAsync(It.IsAny<ScopeContext>(), "f1", It.IsAny<CancellationToken>()))
            .ReturnsAsync(Inspect(FindingSeverity.Critical, findingId: "f1"));

        Mock<IRunRepository> runs = new();
        runs
            .Setup(r => r.GetByIdAsync(It.IsAny<ScopeContext>(), runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RunRecord { ArchitectureRequestId = "req-1" });

        Mock<IArchitectureRequestRepository> requests = new();
        requests
            .Setup(r => r.GetByIdAsync("req-1", It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ArchitectureRequest { SystemName = "BillingSvc" });

        ScopeContext scope = Scope();
        ItsmOutboundIssueCreationService sut = new(
            findings.Object,
            Mock.Of<IItsmFindingCorrelationRepository>(),
            Mock.Of<ITenantItsmOutboundSettingsRepository>(),
            runs.Object,
            requests.Object,
            Monitor(OutboundServiceNowConfigured()).Object,
            PublicSiteMonitor().Object,
            JiraClient(new UnexpectedHttpCallMessageHandler()),
            ServiceNowClient(handler));

        ItsmOutboundIssueCreationResult result = await sut.TryCreateForFindingAsync(
            ItsmOutboundIssueProvider.ServiceNow,
            scope,
            "f1",
            CancellationToken.None);

        ItsmOutboundConnectorTestAssertions.AssertClearTerminalOutcome(
            ConnectorName,
            result,
            ItsmOutboundCreateTerminalKind.VendorError);

        AuditEvent audit = result.AuditEvents.Single();
        AuditEventOutboundConnectorConformance.AssertScopePreserved(ConnectorName, scope, audit);
        AuditEventOutboundConnectorConformance.AssertAuditDataExcludesSecretMaterial(ConnectorName, audit.DataJson);
        audit.DataJson.Should().Contain("cmdb_ci_lookup");
    }

    [Fact]
    public async Task ServiceNow_conformance_cmdb_ci_appl_matches_system_name_to_table_name_and_sets_incident_cmdb_ci()
    {
        Guid runId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");
        RecordingHttpMessageHandler handler = new(request =>
        {
            string path = request.RequestUri!.AbsolutePath;

            if (path.Contains("cmdb_ci_appl", StringComparison.Ordinal) && request.Method == HttpMethod.Get)
            {
                request.RequestUri!.Query.Should().Contain("sysparm_query=name=");
                request.RequestUri!.ToString().Should().Contain(Uri.EscapeDataString("BillingSvc"));

                return new HttpResponseMessage(HttpStatusCode.OK)
                {
                    Content = new StringContent(
                        """{"result":[{"sys_id":"cmdb-appl-77","name":"BillingSvc"}]}""",
                        Encoding.UTF8,
                        "application/json")
                };
            }

            if (path.EndsWith("/incident", StringComparison.OrdinalIgnoreCase) && request.Method == HttpMethod.Post)
            {
                return new HttpResponseMessage(HttpStatusCode.Created)
                {
                    Content = new StringContent(
                        """{"result":{"sys_id":"inc-1","number":"INC77"}}""",
                        Encoding.UTF8,
                        "application/json")
                };
            }

            return new HttpResponseMessage(HttpStatusCode.BadRequest);
        });

        Mock<IFindingInspectReadRepository> findings = new();
        findings
            .Setup(f => f.GetInspectAsync(It.IsAny<ScopeContext>(), "f1", It.IsAny<CancellationToken>()))
            .ReturnsAsync(Inspect(FindingSeverity.Critical, findingId: "f1"));

        Mock<IRunRepository> runs = new();
        runs
            .Setup(r => r.GetByIdAsync(It.IsAny<ScopeContext>(), runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RunRecord { ArchitectureRequestId = "req-billing" });

        Mock<IArchitectureRequestRepository> requests = new();
        requests
            .Setup(r => r.GetByIdAsync("req-billing", It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ArchitectureRequest { SystemName = "BillingSvc" });

        Mock<IItsmFindingCorrelationRepository> correlations = new();
        correlations
            .Setup(c => c.RegisterAsync(
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                "f1",
                "ServiceNow",
                "inc-1",
                "INC77",
                It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        ScopeContext scope = Scope();
        ItsmOutboundIssueCreationService sut = new(
            findings.Object,
            correlations.Object,
            Mock.Of<ITenantItsmOutboundSettingsRepository>(),
            runs.Object,
            requests.Object,
            Monitor(OutboundServiceNowConfigured()).Object,
            PublicSiteMonitor().Object,
            JiraClient(new UnexpectedHttpCallMessageHandler()),
            ServiceNowClient(handler));

        ItsmOutboundIssueCreationResult result = await sut.TryCreateForFindingAsync(
            ItsmOutboundIssueProvider.ServiceNow,
            scope,
            "f1",
            CancellationToken.None);

        ItsmOutboundConnectorTestAssertions.AssertClearTerminalOutcome(
            ConnectorName,
            result,
            ItsmOutboundCreateTerminalKind.Succeeded);

        handler.RequestCount.Should().Be(2);
        handler.LastRequestBody.Should().NotBeNull();
        handler.LastRequestBody!.Should().Contain("cmdb_ci", "incident must reference resolved Application CI sys_id.");
        handler.LastRequestBody.Should().Contain("cmdb-appl-77");

        correlations.Verify(c => c.RegisterAsync(
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                "f1",
                "ServiceNow",
                "inc-1",
                "INC77",
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task
        ServiceNow_conformance_when_tenant_ServiceNowAutoCreateCmdbCi_creates_cmdb_ci_appl_then_posts_incident_with_cmdb_ci()
    {
        Guid runId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");

        string? cmdbCiApplPostBody = null;
        RecordingHttpMessageHandler? handlerWire = null;
        handlerWire = new RecordingHttpMessageHandler(request =>
        {
            string path = request.RequestUri!.AbsolutePath;

            if (path.Contains("cmdb_ci_appl", StringComparison.Ordinal) && request.Method == HttpMethod.Get)
                return new HttpResponseMessage(HttpStatusCode.OK)
                {
                    Content = new StringContent("{\"result\":[]}", Encoding.UTF8, "application/json")
                };

            if (path.Contains("cmdb_ci_appl", StringComparison.Ordinal) && request.Method == HttpMethod.Post)
            {
                cmdbCiApplPostBody = handlerWire!.LastRequestBody;

                return new HttpResponseMessage(HttpStatusCode.Created)
                {
                    Content = new StringContent(
                        """{"result":{"sys_id":"fresh-appl-9"}}""",
                        Encoding.UTF8,
                        "application/json")
                };
            }

            if (path.EndsWith("/incident", StringComparison.OrdinalIgnoreCase) && request.Method == HttpMethod.Post)
            {
                return new HttpResponseMessage(HttpStatusCode.Created)
                {
                    Content = new StringContent(
                        """{"result":{"sys_id":"inc-2","number":"INC88"}}""",
                        Encoding.UTF8,
                        "application/json")
                };
            }

            return new HttpResponseMessage(HttpStatusCode.BadRequest);
        });

        RecordingHttpMessageHandler handler = handlerWire!;

        Mock<ITenantItsmOutboundSettingsRepository> tenantSettings = new();
        tenantSettings
            .Setup(t => t.TryGetAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new TenantItsmOutboundSettings { ServiceNowAutoCreateCmdbCi = true });

        Mock<IFindingInspectReadRepository> findings = new();
        findings
            .Setup(f => f.GetInspectAsync(It.IsAny<ScopeContext>(), "f1", It.IsAny<CancellationToken>()))
            .ReturnsAsync(Inspect(FindingSeverity.Critical, findingId: "f1"));

        Mock<IRunRepository> runs = new();
        runs
            .Setup(r => r.GetByIdAsync(It.IsAny<ScopeContext>(), runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RunRecord { ArchitectureRequestId = "req-new-appl" });

        Mock<IArchitectureRequestRepository> requests = new();
        requests
            .Setup(r => r.GetByIdAsync("req-new-appl", It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ArchitectureRequest { SystemName = "ContosoFulfillmentApi" });

        Mock<IItsmFindingCorrelationRepository> correlations = new();
        correlations
            .Setup(c => c.RegisterAsync(
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                "f1",
                "ServiceNow",
                "inc-2",
                "INC88",
                It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        ScopeContext scope = Scope();
        ItsmOutboundIssueCreationService sut = new(
            findings.Object,
            correlations.Object,
            tenantSettings.Object,
            runs.Object,
            requests.Object,
            Monitor(OutboundServiceNowConfigured()).Object,
            PublicSiteMonitor().Object,
            JiraClient(new UnexpectedHttpCallMessageHandler()),
            ServiceNowClient(handler));

        ItsmOutboundIssueCreationResult result = await sut.TryCreateForFindingAsync(
            ItsmOutboundIssueProvider.ServiceNow,
            scope,
            "f1",
            CancellationToken.None);

        ItsmOutboundConnectorTestAssertions.AssertClearTerminalOutcome(
            ConnectorName,
            result,
            ItsmOutboundCreateTerminalKind.Succeeded);

        handler.RequestCount.Should().Be(3);

        cmdbCiApplPostBody.Should().NotBeNullOrWhiteSpace();
        cmdbCiApplPostBody.Should().Contain("ContosoFulfillmentApi", "created cmdb_ci_appl row maps SystemName to name.");

        handler.LastRequestBody.Should().NotBeNullOrWhiteSpace();
        handler.LastRequestBody!.Should().Contain("fresh-appl-9");
    }

    [Fact]
    public async Task
        ServiceNow_conformance_when_no_cmdb_ci_appl_match_and_autocreate_disabled_omits_cmdb_ci_from_incident()
    {
        Guid runId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");

        RecordingHttpMessageHandler handler = new(request =>
        {
            string path = request.RequestUri!.AbsolutePath;

            if (path.Contains("cmdb_ci_appl", StringComparison.Ordinal) && request.Method == HttpMethod.Get)
                return new HttpResponseMessage(HttpStatusCode.OK)
                {
                    Content = new StringContent("{\"result\":[]}", Encoding.UTF8, "application/json")
                };

            if (path.EndsWith("/incident", StringComparison.OrdinalIgnoreCase) && request.Method == HttpMethod.Post)
            {
                return new HttpResponseMessage(HttpStatusCode.Created)
                {
                    Content = new StringContent(
                        """{"result":{"sys_id":"inc-3","number":"INC99"}}""",
                        Encoding.UTF8,
                        "application/json")
                };
            }

            return new HttpResponseMessage(HttpStatusCode.BadRequest);
        });

        Mock<ITenantItsmOutboundSettingsRepository> tenantSettings = new();
        tenantSettings
            .Setup(t => t.TryGetAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new TenantItsmOutboundSettings { ServiceNowAutoCreateCmdbCi = false });

        Mock<IFindingInspectReadRepository> findings = new();
        findings
            .Setup(f => f.GetInspectAsync(It.IsAny<ScopeContext>(), "f1", It.IsAny<CancellationToken>()))
            .ReturnsAsync(Inspect(FindingSeverity.Warning, findingId: "f1"));

        Mock<IRunRepository> runs = new();
        runs
            .Setup(r => r.GetByIdAsync(It.IsAny<ScopeContext>(), runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RunRecord { ArchitectureRequestId = "req-no-ci" });

        Mock<IArchitectureRequestRepository> requests = new();
        requests
            .Setup(r => r.GetByIdAsync("req-no-ci", It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ArchitectureRequest { SystemName = "UnknownApp" });

        Mock<IItsmFindingCorrelationRepository> correlations = new();
        correlations
            .Setup(c => c.RegisterAsync(
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                "f1",
                "ServiceNow",
                "inc-3",
                "INC99",
                It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        ScopeContext scope = Scope();
        ItsmOutboundIssueCreationService sut = new(
            findings.Object,
            correlations.Object,
            tenantSettings.Object,
            runs.Object,
            requests.Object,
            Monitor(OutboundServiceNowConfigured()).Object,
            PublicSiteMonitor().Object,
            JiraClient(new UnexpectedHttpCallMessageHandler()),
            ServiceNowClient(handler));

        ItsmOutboundIssueCreationResult result = await sut.TryCreateForFindingAsync(
            ItsmOutboundIssueProvider.ServiceNow,
            scope,
            "f1",
            CancellationToken.None);

        ItsmOutboundConnectorTestAssertions.AssertClearTerminalOutcome(
            ConnectorName,
            result,
            ItsmOutboundCreateTerminalKind.Succeeded);

        handler.RequestCount.Should().Be(2);
        handler.LastRequestBody.Should().NotBeNull();
        handler.LastRequestBody!.Should().NotContain("cmdb_ci");
    }
}
