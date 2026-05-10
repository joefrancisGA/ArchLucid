using System.Text.Json;

using ArchLucid.Application.Integrations.Itsm.Outbound;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Scoping;

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

    public static void AssertBasicAuthPresent(HttpRequestMessage request)
    {
        request.Headers.Authorization.Should().NotBeNull();
        request.Headers.Authorization!.Scheme.Should().Be("Basic");
        request.Headers.Authorization.Parameter.Should().NotBeNullOrWhiteSpace();
    }
}
