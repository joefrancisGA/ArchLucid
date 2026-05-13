using System.Net;
using System.Text;
using System.Text.Json;

using ArchLucid.Application.Bootstrap;
using ArchLucid.Application.Integrations.Itsm.Outbound;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Interfaces;

using FluentAssertions;

using Microsoft.Extensions.DependencyInjection;

using WireMock;
using WireMock.RequestBuilders;
using WireMock.ResponseBuilders;
using WireMock.Server;

namespace ArchLucid.Api.Tests.Integrations;

/// <summary>
///     Validates <c>POST /v1/integrations/itsm/outbound/issues</c> against WireMock (production outbound HttpClients).
/// </summary>
[Trait("Category", "Integration")]
[Trait("Suite", "Core")]
public sealed class ItsmOutboundIssuesWireMockEndpointIntegrationTests
{
    private static readonly JsonSerializerOptions JsonWeb = new(JsonSerializerDefaults.Web);

    private static string DemoPrimaryFindingId =>
        $"finding-demo-{ContosoRetailDemoIdentifiers.AuthorityRunBaselineId:N}-primary";

    [SkippableFact]
    public async Task Post_Jira_issues_hits_wire_mock_with_mapper_aligned_payload_and_basic_auth()
    {
        await using ItsmOutboundIssuesWireMockApiFactory factory = new();
        WireMockServer wireMock = factory.UpstreamWireMock;
        wireMock.Reset();

        wireMock
            .Given(Request.Create().WithPath("/rest/api/3/issue").UsingPost())
            .RespondWith(
                Response.Create()
                    .WithStatusCode((int)HttpStatusCode.Created)
                    .WithBody(/*lang=json,strict*/ """{"id":"wire-api-1","key":"DP-WIRE"}"""));

        HttpClient client = factory.CreateClient();
        IntegrationTestBase.WireDefaultSqlIntegrationScopeHeaders(client);

        await SeedDemoBaselineAsync(factory.Services);

        using HttpResponseMessage response =
            await client.PostAsync("/v1/integrations/itsm/outbound/issues", OutboundIssueBody("Jira", DemoPrimaryFindingId));

        response.StatusCode.Should().Be(HttpStatusCode.OK);

        FindingInspectResponse inspect = await LoadPrimaryFindingInspectAsync(factory);

        FindingSeverity outboundSeverity =
            ItsmFindingAuthorityPayloadMapper.TryGetSeverity(inspect.TypedPayload, inspect.Severity);

        string issueType =
            ItsmJiraPriorityAndIssueTypeResolver.ResolveIssueTypeName(outboundSeverity, tenantRow: null);
        string? priorityName =
            ItsmJiraPriorityAndIssueTypeResolver.TryJiraPriorityName(outboundSeverity, jiraSendInfoSeverity: false);
        priorityName.Should().NotBeNull();

        Guid runGuid = inspect.RunId;

        (string summary, string description) =
            ItsmFindingAuthorityPayloadMapper.BuildSummaryAndDescription(DemoPrimaryFindingId, runGuid, inspect.TypedPayload,
                inspect.DecisionRuleName, inspect.RecommendedActions);
        string descriptionForVendor = ItsmOutboundArchLucidDeepLinkAppender.AppendFindingDeepLink(
            description,
            ItsmOutboundIssuesWireMockApiFactory.TestPublicSiteBaseUrl,
            runGuid.ToString("D"),
            DemoPrimaryFindingId);
        JsonElement descriptionAdf = JiraAdfDescriptionBuilder.BuildDescriptionField(descriptionForVendor);

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
                    name = issueType
                },
                priority = new
                {
                    name = priorityName
                },
            },
        };

        string expectedJson = JsonSerializer.Serialize(expectedEnvelope, ContractJson.CamelCaseIgnoreNullCompact);

        IRequestMessage captured =
            ItsmOutboundWireMockEndpointAssertions.RequireSingleOutbound(wireMock, static request =>
                HttpMethod.Post.Method.Equals(request.Method, StringComparison.OrdinalIgnoreCase)
                && "/rest/api/3/issue".Equals(request.AbsolutePath, StringComparison.Ordinal));

        ItsmOutboundWireMockEndpointAssertions.AssertVendorJsonEquivalent(expectedJson, captured.Body,
            "Outbound Jira body via the hosted API must mirror mapper projections.");

        ItsmOutboundWireMockEndpointAssertions.AssertBasicAuthMatches(captured, username: "bot@example.com",
            password: "fake-token");

        string? contentType = ItsmOutboundWireMockEndpointAssertions.TryReadFirstHeaderValue(captured.Headers, "Content-Type");
        ItsmOutboundWireMockEndpointAssertions.AssertContentTypeLooksLikeJson(contentType);
    }

    [SkippableFact]
    public async Task Post_ServiceNow_issues_hits_wire_mock_with_mapper_aligned_payload_and_basic_auth()
    {
        await using ItsmOutboundIssuesWireMockApiFactory factory = new();
        WireMockServer wireMock = factory.UpstreamWireMock;
        wireMock.Reset();

        wireMock
            .Given(Request.Create().WithPath("/api/now/table/cmdb_ci_appl").UsingGet())
            .RespondWith(
                Response.Create()
                    .WithStatusCode((int)HttpStatusCode.OK)
                    .WithBody("""{"result":[]}"""));

        wireMock
            .Given(Request.Create().WithPath("/api/now/table/incident").UsingPost())
            .RespondWith(
                Response.Create()
                    .WithStatusCode((int)HttpStatusCode.Created)
                    .WithBody(/*lang=json,strict*/ """{"result":{"sys_id":"sn-api-wire","number":"INC9411"}}"""));

        HttpClient client = factory.CreateClient();
        IntegrationTestBase.WireDefaultSqlIntegrationScopeHeaders(client);

        await SeedDemoBaselineAsync(factory.Services);

        using HttpResponseMessage response =
            await client.PostAsync("/v1/integrations/itsm/outbound/issues", OutboundIssueBody("ServiceNow", DemoPrimaryFindingId));

        response.StatusCode.Should().Be(HttpStatusCode.OK);

        FindingInspectResponse inspect = await LoadPrimaryFindingInspectAsync(factory);

        FindingSeverity outboundSeverity =
            ItsmFindingAuthorityPayloadMapper.TryGetSeverity(inspect.TypedPayload, inspect.Severity);

        (string urgency, string impact) = ServiceNowUrgencyImpactResolver.Resolve(outboundSeverity);

        Guid runGuid = inspect.RunId;

        (string summary, string description) =
            ItsmFindingAuthorityPayloadMapper.BuildSummaryAndDescription(DemoPrimaryFindingId, runGuid, inspect.TypedPayload,
                inspect.DecisionRuleName, inspect.RecommendedActions);

        string descriptionForVendor = ItsmOutboundArchLucidDeepLinkAppender.AppendFindingDeepLink(
            description,
            ItsmOutboundIssuesWireMockApiFactory.TestPublicSiteBaseUrl,
            runGuid.ToString("D"),
            DemoPrimaryFindingId);

        object expectedIncident = new
        {
            short_description = summary,
            description = descriptionForVendor,
            urgency,
            impact
        };

        string expectedJson = JsonSerializer.Serialize(expectedIncident, ContractJson.CamelCaseIgnoreNullCompact);

        IRequestMessage captured = ItsmOutboundWireMockEndpointAssertions.RequireSingleOutbound(wireMock, static request =>
            HttpMethod.Post.Method.Equals(request.Method, StringComparison.OrdinalIgnoreCase)
            && "/api/now/table/incident".Equals(request.AbsolutePath, StringComparison.Ordinal));

        ItsmOutboundWireMockEndpointAssertions.AssertVendorJsonEquivalent(expectedJson, captured.Body,
            "Outbound ServiceNow incident body via the hosted API must mirror mapper projections.");

        ItsmOutboundWireMockEndpointAssertions.AssertBasicAuthMatches(captured, username: "svc", password: "pwd");
    }

    private static async Task SeedDemoBaselineAsync(IServiceProvider rootServices)
    {
        using IServiceScope scope = rootServices.CreateScope();

        await scope.ServiceProvider.GetRequiredService<IDemoSeedService>().SeedAsync();
    }

    private static async Task<FindingInspectResponse> LoadPrimaryFindingInspectAsync(
        ItsmOutboundIssuesWireMockApiFactory factory)
    {
        using IServiceScope scope = factory.Services.CreateScope();

        ScopeContext scoped = SqlIntegrationScope;
        IFindingInspectReadRepository repo = scope.ServiceProvider.GetRequiredService<IFindingInspectReadRepository>();

        FindingInspectResponse? inspect =
            await repo.GetInspectAsync(scoped, DemoPrimaryFindingId, CancellationToken.None);

        inspect.Should().NotBeNull();

        return inspect;
    }

    private static ScopeContext SqlIntegrationScope =>
        new()
        {
            TenantId = ScopeIds.DefaultTenant,
            WorkspaceId = ScopeIds.DefaultWorkspace,
            ProjectId = ScopeIds.DefaultProject,
        };

    private static StringContent OutboundIssueBody(string provider, string findingId)
    {
        string json = JsonSerializer.Serialize(
            new Dictionary<string, string> { ["provider"] = provider, ["findingId"] = findingId },
            JsonWeb);

        return new StringContent(json, Encoding.UTF8, "application/json");
    }
}
