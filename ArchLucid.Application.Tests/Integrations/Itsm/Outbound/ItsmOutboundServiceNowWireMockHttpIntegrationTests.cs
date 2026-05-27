using System.Net;
using System.Text.Json;

using ArchLucid.Application.Integrations.Itsm.Outbound;
using ArchLucid.Contracts.Common;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Integrations;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;

using Moq;

using WireMock;
using WireMock.RequestBuilders;
using WireMock.ResponseBuilders;
using WireMock.Server;

using static ArchLucid.Application.Tests.Integrations.Itsm.Outbound.ItsmOutboundConnectorTestFixture;

namespace ArchLucid.Application.Tests.Integrations.Itsm.Outbound;

/// <summary>WireMock verifies exact ServiceNow incident Table API payloads (no live SaaS).</summary>
[Trait("Suite", "Core")]
[Trait("Category", "Integration")]
public sealed class ItsmOutboundServiceNowWireMockHttpIntegrationTests
{
    private const string WiredFindingId = "f-wiremock-sn";

    [Fact]
    public async Task ServiceNow_wiremock_posts_expected_incident_json_and_headers_when_cmdb_skipped()
    {
        using WireMockServer server = WireMockServer.Start();

        server
            .Given(Request.Create().WithPath("/api/now/table/incident").UsingPost())
            .RespondWith(
                Response.Create()
                    .WithStatusCode((int)HttpStatusCode.Created)
                    .WithHeader("Content-Type", "application/json")
                    .WithBody(/*lang=json,strict*/ """{"result":{"sys_id":"sn-wire-42","number":"INC8001"}}"""));

        Guid runId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");

        FindingInspectResponse inspect = new FindingInspectResponse
        {
            FindingId = WiredFindingId,
            RunId = runId,
            Severity = FindingSeverity.Error,
            TypedPayload = JsonSerializer.SerializeToElement(new ArchitectureFinding
            {
                FindingId = WiredFindingId,
                Severity = FindingSeverity.Error,
                Message = "SN wiremock",
            }),
            HumanReviewStatus = FindingHumanReviewStatus.Pending,
            Evidence = [],
            RecommendedActions = [],
        };

        (string summary, string description) =
            ItsmFindingAuthorityPayloadMapper.BuildSummaryAndDescription(WiredFindingId, runId, inspect.TypedPayload, inspect.DecisionRuleName,
                inspect.RecommendedActions);

        object expectedIncidentPayload = new
        {
            short_description = summary,
            description,
            urgency = "2",
            impact = "1",
        };

        string expectedJson = JsonSerializer.Serialize(expectedIncidentPayload, ContractJson.CamelCaseIgnoreNullCompact);

        Mock<IFindingInspectReadRepository> findings = new();
        findings.Setup(f =>
                f.GetInspectAsync(It.IsAny<ScopeContext>(), WiredFindingId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(inspect);

        Mock<IItsmFindingCorrelationRepository> correlations = new();
        correlations.Setup(c =>
                c.RegisterAsync(
                    It.IsAny<Guid>(),
                    It.IsAny<Guid>(),
                    It.IsAny<Guid>(),
                    WiredFindingId,
                    "ServiceNow",
                    "sn-wire-42",
                    "INC8001",
                    It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        Mock<IRunRepository> runs = new();
        runs.Setup(r =>
                r.GetByIdAsync(It.IsAny<ScopeContext>(), runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RunRecord { ArchitectureRequestId = null });

        ScopeContext scope = Scope();
        IntegrationsItsmOutboundOptions options = OutboundServiceNowConfigured(server.Url!.TrimEnd('/'));

        using HttpClient snowHttp = new()
        {
            Timeout = TimeSpan.FromSeconds(25)
        };

        ItsmOutboundIssueCreationService sut = new(
            findings.Object,
            correlations.Object,
            Mock.Of<ITenantItsmOutboundSettingsRepository>(),
            runs.Object,
            Mock.Of<IArchitectureRequestRepository>(),
            Monitor(options).Object,
            PublicSiteMonitor().Object,
            JiraClient(new TestSupport.Http.UnexpectedHttpCallMessageHandler()),
            new ServiceNowOutboundIncidentClient(snowHttp, NullLogger<ServiceNowOutboundIncidentClient>.Instance));

        ItsmOutboundIssueCreationResult got =
            await sut.TryCreateForFindingAsync(ItsmOutboundIssueProvider.ServiceNow, scope, WiredFindingId, CancellationToken.None);

        got.Kind.Should().Be(ItsmOutboundCreateTerminalKind.Succeeded);

        IRequestMessage outbound = ItsmOutboundWireMockAssertions.RequireSingleOutbound(server, MatchesIncidentPost);

        ItsmOutboundWireMockAssertions.AssertJsonEquivalent(expectedJson, outbound.Body,
            "ServiceNow incident POST body must match mapper output + urgency/impact resolver.");

        string? contentType =
            ItsmOutboundWireMockAssertions.TryReadFirstHeaderValue(outbound.Headers, "Content-Type");

        ItsmOutboundWireMockAssertions.AssertContentTypeLooksLikeJson(contentType);

        ItsmOutboundWireMockAssertions.AssertBasicAuthMatches(outbound, options.ServiceNow.Username!, options.ServiceNow.Password!);

        correlations.Verify(c =>
                    c.RegisterAsync(scope.TenantId, scope.WorkspaceId, scope.ProjectId, WiredFindingId, "ServiceNow", "sn-wire-42", "INC8001",
                        It.IsAny<CancellationToken>()),
                Times.Once);
    }

    [Fact]
    public async Task ServiceNow_wiremock_upstream_http_503_is_vendor_error()
    {
        using WireMockServer server = WireMockServer.Start();

        server
            .Given(Request.Create().WithPath("/api/now/table/incident").UsingPost())
            .RespondWith(Response.Create().WithStatusCode((int)HttpStatusCode.ServiceUnavailable).WithBody("{\"error\":\"nope\"}"));

        Guid runId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");

        FindingInspectResponse inspect = new FindingInspectResponse
        {
            FindingId = "f-sn400",
            RunId = runId,
            Severity = FindingSeverity.Warning,
            TypedPayload = JsonSerializer.SerializeToElement(new ArchitectureFinding
            {
                FindingId = "f-sn400",
                Severity = FindingSeverity.Warning,
                Message = "x",
            }),
            HumanReviewStatus = FindingHumanReviewStatus.Pending,
            Evidence = [],
            RecommendedActions = [],
        };

        Mock<IFindingInspectReadRepository> findings = new();
        findings.Setup(f =>
                f.GetInspectAsync(It.IsAny<ScopeContext>(), "f-sn400", It.IsAny<CancellationToken>()))
            .ReturnsAsync(inspect);

        Mock<IRunRepository> runs = new();
        runs.Setup(r =>
                r.GetByIdAsync(It.IsAny<ScopeContext>(), runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RunRecord());

        IntegrationsItsmOutboundOptions options = OutboundServiceNowConfigured(server.Url!.TrimEnd('/'));

        using HttpClient snowHttp = new();
        snowHttp.Timeout = TimeSpan.FromSeconds(15);

        ItsmOutboundIssueCreationService sut = new(
            findings.Object,
            Mock.Of<IItsmFindingCorrelationRepository>(),
            Mock.Of<ITenantItsmOutboundSettingsRepository>(),
            runs.Object,
            Mock.Of<IArchitectureRequestRepository>(),
            Monitor(options).Object,
            PublicSiteMonitor().Object,
            JiraClient(new TestSupport.Http.UnexpectedHttpCallMessageHandler()),
            new ServiceNowOutboundIncidentClient(snowHttp, NullLogger<ServiceNowOutboundIncidentClient>.Instance));

        ItsmOutboundIssueCreationResult got =
            await sut.TryCreateForFindingAsync(ItsmOutboundIssueProvider.ServiceNow, scope: Scope(), "f-sn400", CancellationToken.None);

        got.Kind.Should().Be(ItsmOutboundCreateTerminalKind.VendorError);
        got.VendorStatusCode.Should().Be((int)HttpStatusCode.ServiceUnavailable);

        _ = ItsmOutboundWireMockAssertions.RequireSingleOutbound(server, MatchesIncidentPost);
    }

    [Fact]
    public async Task ServiceNow_wiremock_upstream_http_500_is_vendor_error()
    {
        using WireMockServer server = WireMockServer.Start();

        server
            .Given(Request.Create().WithPath("/api/now/table/incident").UsingPost())
            .RespondWith(Response.Create().WithStatusCode((int)HttpStatusCode.InternalServerError));

        Guid runId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");

        FindingInspectResponse inspect = new FindingInspectResponse
        {
            FindingId = "f-sn500",
            RunId = runId,
            Severity = FindingSeverity.Warning,
            TypedPayload = JsonSerializer.SerializeToElement(new ArchitectureFinding
            {
                FindingId = "f-sn500",
                Severity = FindingSeverity.Warning,
                Message = "x",
            }),
            HumanReviewStatus = FindingHumanReviewStatus.Pending,
            Evidence = [],
            RecommendedActions = [],
        };

        Mock<IFindingInspectReadRepository> findings = new();
        findings.Setup(f =>
                f.GetInspectAsync(It.IsAny<ScopeContext>(), "f-sn500", It.IsAny<CancellationToken>()))
            .ReturnsAsync(inspect);

        Mock<IRunRepository> runs = new();
        runs.Setup(r =>
                r.GetByIdAsync(It.IsAny<ScopeContext>(), runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RunRecord());

        IntegrationsItsmOutboundOptions options = OutboundServiceNowConfigured(server.Url!.TrimEnd('/'));

        using HttpClient snowHttp = new();
        snowHttp.Timeout = TimeSpan.FromSeconds(15);

        ItsmOutboundIssueCreationService sut = new(
            findings.Object,
            Mock.Of<IItsmFindingCorrelationRepository>(),
            Mock.Of<ITenantItsmOutboundSettingsRepository>(),
            runs.Object,
            Mock.Of<IArchitectureRequestRepository>(),
            Monitor(options).Object,
            PublicSiteMonitor().Object,
            JiraClient(new TestSupport.Http.UnexpectedHttpCallMessageHandler()),
            new ServiceNowOutboundIncidentClient(snowHttp, NullLogger<ServiceNowOutboundIncidentClient>.Instance));

        ItsmOutboundIssueCreationResult got =
            await sut.TryCreateForFindingAsync(ItsmOutboundIssueProvider.ServiceNow, scope: Scope(), "f-sn500", CancellationToken.None);

        got.Kind.Should().Be(ItsmOutboundCreateTerminalKind.VendorError);
        got.VendorStatusCode.Should().Be((int)HttpStatusCode.InternalServerError);

        _ = ItsmOutboundWireMockAssertions.RequireSingleOutbound(server, MatchesIncidentPost);
    }

    static bool MatchesIncidentPost(IRequestMessage message) =>
        HttpMethod.Post.Method.Equals(message.Method, StringComparison.OrdinalIgnoreCase)
        && message.AbsolutePath.Equals("/api/now/table/incident", StringComparison.Ordinal);
}
