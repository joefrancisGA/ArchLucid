using System.Text.Json;

using ArchLucid.Application.Integrations.Itsm;
using ArchLucid.Application.Integrations.Itsm.OAuth;
using ArchLucid.Application.Integrations.Itsm.Outbound;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Manifest;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Secrets;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Integrations;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Queries;

using ArchLucid.TestSupport.Http;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Application.Tests.Integrations.Itsm.Outbound;

/// <summary>Shared factories for ITSM outbound connector conformance tests (no live SaaS calls).</summary>
internal static class ItsmOutboundConnectorTestFixture
{
    public static ScopeContext Scope() =>
        new()
        {
            TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
            WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
            ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc")
        };

    public static FindingInspectResponse Inspect(FindingSeverity severity, string findingId = "fid1") =>
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

    public static IntegrationsItsmOutboundOptions OutboundJiraConfigured(string projectKey = "DP") =>
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

    public static IntegrationsItsmOutboundOptions OutboundServiceNowConfigured(string instanceBaseUrl = "https://sn.example") =>
        new()
        {
            Jira = new JiraItsmOutboundOptions(),
            ServiceNow = new ServiceNowItsmOutboundOptions { InstanceBaseUrl = instanceBaseUrl, Username = "u", Password = "p" }
        };

    public static Mock<IOptionsMonitor<PublicSiteOptions>> PublicSiteMonitor(string baseUrl = "")
    {
        Mock<IOptionsMonitor<PublicSiteOptions>> monitor = new();
        monitor.Setup(x => x.CurrentValue).Returns(new PublicSiteOptions { BaseUrl = baseUrl });

        return monitor;
    }

    // Named Monitor for call-site brevity in tests; prevents binding to System.Threading.Monitor when imported via using static.
    public static Mock<IOptionsMonitor<IntegrationsItsmOutboundOptions>> Monitor(IntegrationsItsmOutboundOptions options)
    {
        Mock<IOptionsMonitor<IntegrationsItsmOutboundOptions>> monitor = new();
        monitor.Setup(x => x.CurrentValue).Returns(options);

        return monitor;
    }

    public static JiraOutboundIssueClient JiraClient(HttpMessageHandler handler) =>
        new(new HttpClient(handler) { Timeout = TimeSpan.FromSeconds(5) }, NullLogger<JiraOutboundIssueClient>.Instance);

    public static ServiceNowOutboundIncidentClient ServiceNowClient(HttpMessageHandler handler) =>
        new(new HttpClient(handler) { Timeout = TimeSpan.FromSeconds(5) }, NullLogger<ServiceNowOutboundIncidentClient>.Instance);

    public static IItsmTenantConnectorCredentialResolver CredentialResolver(IntegrationsItsmOutboundOptions outbound)
    {
        Mock<IOptionsMonitor<IntegrationsItsmInboundOptions>> inboundMonitor = new();
        inboundMonitor.Setup(x => x.CurrentValue).Returns(new IntegrationsItsmInboundOptions());

        return new ItsmTenantConnectorCredentialResolver(
            new InMemoryTenantItsmConnectorConnectionRepository(),
            new NullSecretProvider(),
            Monitor(outbound).Object,
            inboundMonitor.Object);
    }

    public static IItsmOutboundHttpAuthenticator HttpAuthenticator() =>
        new ItsmOutboundHttpAuthenticator(
            Mock.Of<IItsmConnectorOAuthTokenExchanger>(),
            new ItsmConnectorOAuthAccessTokenCache());

    public static IExternalTicketConnectorRegistry ConnectorRegistry(
        IItsmFindingCorrelationRepository correlations,
        ITenantItsmOutboundSettingsRepository tenantItsmOutboundSettings,
        IRunRepository runRepository,
        IArchitectureRequestRepository architectureRequests,
        IItsmTenantConnectorCredentialResolver credentialResolver,
        IOptionsMonitor<IntegrationsItsmOutboundOptions> outboundOptions,
        IOptionsMonitor<PublicSiteOptions> publicSiteOptions,
        JiraOutboundIssueClient jiraClient,
        ServiceNowOutboundIncidentClient serviceNowClient) =>
        new ExternalTicketConnectorRegistry(
        [
            new JiraExternalTicketConnector(
                correlations,
                credentialResolver,
                outboundOptions,
                publicSiteOptions,
                tenantItsmOutboundSettings,
                jiraClient,
                HttpAuthenticator()),
            new ServiceNowExternalTicketConnector(
                correlations,
                credentialResolver,
                publicSiteOptions,
                runRepository,
                architectureRequests,
                serviceNowClient,
                HttpAuthenticator())
        ]);

    public static ItsmOutboundIssueCreationService IssueCreationService(
        IFindingInspectReadRepository findingInspectReadRepository,
        IItsmFindingCorrelationRepository correlations,
        ITenantItsmOutboundSettingsRepository tenantItsmOutboundSettings,
        IRunRepository runRepository,
        IArchitectureRequestRepository architectureRequests,
        IItsmTenantConnectorCredentialResolver credentialResolver,
        IOptionsMonitor<IntegrationsItsmOutboundOptions> outboundOptions,
        IOptionsMonitor<PublicSiteOptions> publicSiteOptions,
        JiraOutboundIssueClient jiraClient,
        ServiceNowOutboundIncidentClient serviceNowClient) =>
        new(
            findingInspectReadRepository,
            correlations,
            tenantItsmOutboundSettings,
            ConnectorRegistry(
                correlations,
                tenantItsmOutboundSettings,
                runRepository,
                architectureRequests,
                credentialResolver,
                outboundOptions,
                publicSiteOptions,
                jiraClient,
                serviceNowClient),
            ItsmOutboundSealedManifestTestSupport.CreateAuthorityQueryService(
                Scope(),
                Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd")),
            ItsmOutboundSealedManifestTestSupport.CreateManifestHashService());

    public static ItsmExternalTicketUrlBuilder UrlBuilder(
        IItsmFindingCorrelationRepository correlations,
        ITenantItsmOutboundSettingsRepository tenantItsmOutboundSettings,
        IRunRepository runRepository,
        IArchitectureRequestRepository architectureRequests,
        IItsmTenantConnectorCredentialResolver credentialResolver,
        IOptionsMonitor<IntegrationsItsmOutboundOptions> outboundOptions,
        IOptionsMonitor<PublicSiteOptions> publicSiteOptions,
        JiraOutboundIssueClient jiraClient,
        ServiceNowOutboundIncidentClient serviceNowClient) =>
        new(
            ConnectorRegistry(
                correlations,
                tenantItsmOutboundSettings,
                runRepository,
                architectureRequests,
                credentialResolver,
                outboundOptions,
                publicSiteOptions,
                jiraClient,
                serviceNowClient));

    public static ItsmExternalTicketUrlBuilder UrlBuilder(IntegrationsItsmOutboundOptions outbound)
    {
        HttpMessageHandler noop = new UnexpectedHttpCallMessageHandler();
        IItsmTenantConnectorCredentialResolver credentialResolver = CredentialResolver(outbound);

        return UrlBuilder(
            new InMemoryItsmFindingCorrelationRepository(),
            Mock.Of<ITenantItsmOutboundSettingsRepository>(),
            Mock.Of<IRunRepository>(),
            Mock.Of<IArchitectureRequestRepository>(),
            credentialResolver,
            Monitor(outbound).Object,
            PublicSiteMonitor().Object,
            JiraClient(noop),
            ServiceNowClient(noop));
    }

    public static void AssertBasicAuthPresent(HttpRequestMessage request)
    {
        request.Headers.Authorization.Should().NotBeNull();
        request.Headers.Authorization!.Scheme.Should().Be("Basic");
        request.Headers.Authorization.Parameter.Should().NotBeNullOrWhiteSpace();
    }

    private sealed class NullSecretProvider : ISecretProvider
    {
        public Task<string?> GetSecretAsync(string secretName, CancellationToken ct) => Task.FromResult<string?>(null);
    }
}
