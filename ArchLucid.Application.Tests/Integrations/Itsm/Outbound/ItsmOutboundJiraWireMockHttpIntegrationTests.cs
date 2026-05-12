using System.Net;
using System.Text.Json;

using ArchLucid.Application.Integrations.Itsm.Outbound;
using ArchLucid.Contracts.Common;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Integrations;
using ArchLucid.Persistence.Interfaces;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;

using Moq;

using WireMock;
using WireMock.RequestBuilders;
using WireMock.ResponseBuilders;
using WireMock.Server;

using static ArchLucid.Application.Tests.Integrations.Itsm.Outbound.ItsmOutboundConnectorTestFixture;

namespace ArchLucid.Application.Tests.Integrations.Itsm.Outbound;

/// <summary>WireMock verifies exact Jira Cloud issue REST payloads (no live SaaS).</summary>
[Trait("Suite", "Core")]
[Trait("Category", "Integration")]
public sealed class ItsmOutboundJiraWireMockHttpIntegrationTests
{
    private const string WiredFindingId = "f-wiremock-jira";

    [Fact]
    public async Task Jira_wiremock_posts_expected_json_and_headers()
    {
        using WireMockServer server = WireMockServer.Start();

        server
            .Given(Request.Create().WithPath("/rest/api/3/issue").UsingPost())
            .RespondWith(
                Response.Create()
                    .WithStatusCode((int)HttpStatusCode.Created)
                    .WithHeader("Content-Type", "application/json")
                    .WithBody(/*lang=json,strict*/ """{"id":"501","key":"WM-777"}"""));

        FindingInspectResponse inspect = Inspect(FindingSeverity.Error, findingId: WiredFindingId);
        Guid runIdGuid = inspect.RunId;

        (string summary, string description) =
            ItsmFindingAuthorityPayloadMapper.BuildSummaryAndDescription(WiredFindingId, runIdGuid, inspect.TypedPayload,
                inspect.DecisionRuleName, inspect.RecommendedActions);
        JsonElement descriptionAdf = JiraAdfDescriptionBuilder.BuildDescriptionField(description);

        object expectedEnvelope = new
        {
            fields = new
            {
                project = new
                {
                    key = "DP"
                },
                summary,
                description = descriptionAdf,
                issuetype = new
                {
                    name = "Task"
                },
                priority = new
                {
                    name = "High"
                },
            },
        };

        string expectedJson = JsonSerializer.Serialize(expectedEnvelope, ContractJson.CamelCaseIgnoreNullCompact);

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
                    "Jira",
                    "WM-777",
                    "501",
                    It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        ScopeContext scope = Scope();
        IntegrationsItsmOutboundOptions options = OutboundJiraConfigured();
        options.Jira.CloudBaseUrl = server.Url!.TrimEnd('/');

        using HttpClient jiraHttp = new()
        {
            Timeout = TimeSpan.FromSeconds(25)
        };

        ItsmOutboundIssueCreationService sut = new(
            findings.Object,
            correlations.Object,
            Mock.Of<ITenantItsmOutboundSettingsRepository>(),
            Mock.Of<IRunRepository>(),
            Mock.Of<IArchitectureRequestRepository>(),
            Monitor(options).Object,
            PublicSiteMonitor().Object,
            new JiraOutboundIssueClient(jiraHttp, NullLogger<JiraOutboundIssueClient>.Instance),
            new ServiceNowOutboundIncidentClient(
                new HttpClient(new TestSupport.Http.UnexpectedHttpCallMessageHandler()) { Timeout = TimeSpan.FromSeconds(5) },
                NullLogger<ServiceNowOutboundIncidentClient>.Instance));

        ItsmOutboundIssueCreationResult result =
            await sut.TryCreateForFindingAsync(ItsmOutboundIssueProvider.Jira, scope, WiredFindingId, CancellationToken.None);

        result.Kind.Should().Be(ItsmOutboundCreateTerminalKind.Succeeded);

        IRequestMessage outbound = ItsmOutboundWireMockAssertions.RequireSingleOutbound(server, MatchesJiraIssuePost);

        ItsmOutboundWireMockAssertions.AssertJsonEquivalent(expectedJson, outbound.Body,
            "Jira outbound POST body must match mapper + ADF contract JSON.");

        string? contentType =
            ItsmOutboundWireMockAssertions.TryReadFirstHeaderValue(outbound.Headers, "Content-Type");

        ItsmOutboundWireMockAssertions.AssertContentTypeLooksLikeJson(contentType);

        ItsmOutboundWireMockAssertions.AssertBasicAuthMatches(outbound, options.Jira.ServiceAccountEmail,
            options.Jira.ApiToken);

        correlations.Verify(c =>
                    c.RegisterAsync(
                        scope.TenantId,
                        scope.WorkspaceId,
                        scope.ProjectId,
                        WiredFindingId,
                        "Jira",
                        "WM-777",
                        "501",
                        It.IsAny<CancellationToken>()),
                Times.Once);
    }

    [Fact]
    public async Task Jira_wiremock_upstream_http_400_is_vendor_error()
    {
        using WireMockServer server = WireMockServer.Start();

        server
            .Given(Request.Create().WithPath("/rest/api/3/issue").UsingPost())
            .RespondWith(Response.Create().WithStatusCode((int)HttpStatusCode.BadRequest).WithBody("{\"reason\":\"bad\"}"));

        Mock<IFindingInspectReadRepository> findings = new();
        findings.Setup(f =>
                f.GetInspectAsync(It.IsAny<ScopeContext>(), "f-j400", It.IsAny<CancellationToken>()))
            .ReturnsAsync(Inspect(FindingSeverity.Warning, findingId: "f-j400"));

        IntegrationsItsmOutboundOptions options = OutboundJiraConfigured();
        options.Jira.CloudBaseUrl = server.Url!.TrimEnd('/');

        using HttpClient jiraHttp = new()
        {
            Timeout = TimeSpan.FromSeconds(15)
        };

        ItsmOutboundIssueCreationService sut = new(
            findings.Object,
            Mock.Of<IItsmFindingCorrelationRepository>(),
            Mock.Of<ITenantItsmOutboundSettingsRepository>(),
            Mock.Of<IRunRepository>(),
            Mock.Of<IArchitectureRequestRepository>(),
            Monitor(options).Object,
            PublicSiteMonitor().Object,
            new JiraOutboundIssueClient(jiraHttp, NullLogger<JiraOutboundIssueClient>.Instance),
            new ServiceNowOutboundIncidentClient(
                new HttpClient(new TestSupport.Http.UnexpectedHttpCallMessageHandler()) { Timeout = TimeSpan.FromSeconds(5) },
                NullLogger<ServiceNowOutboundIncidentClient>.Instance));

        ItsmOutboundIssueCreationResult got =
            await sut.TryCreateForFindingAsync(ItsmOutboundIssueProvider.Jira, scope: Scope(), "f-j400", CancellationToken.None);

        got.Kind.Should().Be(ItsmOutboundCreateTerminalKind.VendorError);
        got.VendorStatusCode.Should().Be((int)HttpStatusCode.BadRequest);

        _ = ItsmOutboundWireMockAssertions.RequireSingleOutbound(server, MatchesJiraIssuePost);
    }

    [Fact]
    public async Task Jira_wiremock_upstream_http_500_is_vendor_error()
    {
        using WireMockServer server = WireMockServer.Start();

        server
            .Given(Request.Create().WithPath("/rest/api/3/issue").UsingPost())
            .RespondWith(Response.Create().WithStatusCode((int)HttpStatusCode.InternalServerError));

        Mock<IFindingInspectReadRepository> findings = new();
        findings.Setup(f =>
                f.GetInspectAsync(It.IsAny<ScopeContext>(), "f-j500", It.IsAny<CancellationToken>()))
            .ReturnsAsync(Inspect(FindingSeverity.Warning, findingId: "f-j500"));

        IntegrationsItsmOutboundOptions options = OutboundJiraConfigured();
        options.Jira.CloudBaseUrl = server.Url!.TrimEnd('/');

        using HttpClient jiraHttp = new();
        jiraHttp.Timeout = TimeSpan.FromSeconds(15);

        ItsmOutboundIssueCreationService sut = new(
            findings.Object,
            Mock.Of<IItsmFindingCorrelationRepository>(),
            Mock.Of<ITenantItsmOutboundSettingsRepository>(),
            Mock.Of<IRunRepository>(),
            Mock.Of<IArchitectureRequestRepository>(),
            Monitor(options).Object,
            PublicSiteMonitor().Object,
            new JiraOutboundIssueClient(jiraHttp, NullLogger<JiraOutboundIssueClient>.Instance),
            new ServiceNowOutboundIncidentClient(
                new HttpClient(new TestSupport.Http.UnexpectedHttpCallMessageHandler()) { Timeout = TimeSpan.FromSeconds(5) },
                NullLogger<ServiceNowOutboundIncidentClient>.Instance));

        ItsmOutboundIssueCreationResult got =
            await sut.TryCreateForFindingAsync(ItsmOutboundIssueProvider.Jira, scope: Scope(), "f-j500", CancellationToken.None);

        got.Kind.Should().Be(ItsmOutboundCreateTerminalKind.VendorError);
        got.VendorStatusCode.Should().Be((int)HttpStatusCode.InternalServerError);

        _ = ItsmOutboundWireMockAssertions.RequireSingleOutbound(server, MatchesJiraIssuePost);
    }

    static bool MatchesJiraIssuePost(IRequestMessage message) =>
        HttpMethod.Post.Method.Equals(message.Method, StringComparison.OrdinalIgnoreCase)
        && message.AbsolutePath.Equals("/rest/api/3/issue", StringComparison.Ordinal);
}
