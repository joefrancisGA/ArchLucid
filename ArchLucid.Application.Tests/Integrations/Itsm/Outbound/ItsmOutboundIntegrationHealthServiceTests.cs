using System.Net;
using System.Net.Http.Headers;
using System.Text;

using ArchLucid.Application.Integrations.Itsm.Outbound;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Integrations;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

using Moq;

using static ArchLucid.Application.Tests.Integrations.Itsm.Outbound.ItsmOutboundConnectorTestFixture;

namespace ArchLucid.Application.Tests.Integrations.Itsm.Outbound;
[Trait("Category", "Unit")]

public sealed class ItsmOutboundIntegrationHealthServiceTests
{
    private static readonly Guid TenantId = Guid.Parse("11111111-1111-1111-1111-111111111111");

    [Fact]
    public async Task GetHealthAsync_when_neither_vendor_locally_ready_returns_not_configured_without_503_flag()
    {
        IntegrationsItsmOutboundOptions options = new();
        Mock<IOptionsMonitor<IntegrationsItsmOutboundOptions>> monitor = new();
        monitor.Setup(static m => m.CurrentValue).Returns(options);

        Mock<ITenantItsmOutboundSettingsRepository> tenantRepo = new();
        tenantRepo
            .Setup(t => t.TryGetAsync(TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((TenantItsmOutboundSettings?)null);

        Mock<IHttpClientFactory> factory = new(MockBehavior.Strict);

        ItsmOutboundIntegrationHealthService sut = new(
            factory.Object,
            monitor.Object,
            tenantRepo.Object,
            CredentialResolver(new IntegrationsItsmOutboundOptions()),
            HttpAuthenticator(),
            NullLogger<ItsmOutboundIntegrationHealthService>.Instance);

        ScopeContext scope = new()
        {
            TenantId = TenantId,
            WorkspaceId = Guid.Parse("22222222-2222-2222-2222-222222222222"),
            ProjectId = Guid.Parse("33333333-3333-3333-3333-333333333333"),
        };

        ItsmOutboundIntegrationHealthReport report =
            await sut.GetHealthAsync(scope, CancellationToken.None);

        report.Status.Should().Be("not_configured");
        report.Return503.Should().BeFalse();
        report.Jira.LocallyConfigured.Should().BeFalse();
        report.ServiceNow.LocallyConfigured.Should().BeFalse();

        tenantRepo.Verify(t => t.TryGetAsync(TenantId, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task GetStoredHealthAsync_when_jira_locally_ready_returns_not_tested_without_http()
    {
        IntegrationsItsmOutboundOptions options = new()
        {
            Jira =
            {
                CloudBaseUrl = "https://mock-jira.health.test",
                ServiceAccountEmail = "bot@example.com",
                ApiToken = "token",
                DefaultProjectKey = "DP",
            },
        };

        Mock<IOptionsMonitor<IntegrationsItsmOutboundOptions>> monitor = new();
        monitor.Setup(static m => m.CurrentValue).Returns(options);

        Mock<ITenantItsmOutboundSettingsRepository> tenantRepo = new();
        tenantRepo
            .Setup(t => t.TryGetAsync(TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((TenantItsmOutboundSettings?)null);

        Mock<IHttpClientFactory> factory = new(MockBehavior.Strict);

        ItsmOutboundIntegrationHealthService sut = new(
            factory.Object,
            monitor.Object,
            tenantRepo.Object,
            CredentialResolver(options),
            HttpAuthenticator(),
            NullLogger<ItsmOutboundIntegrationHealthService>.Instance);

        ScopeContext scope = new()
        {
            TenantId = TenantId,
            WorkspaceId = Guid.Parse("22222222-2222-2222-2222-222222222222"),
            ProjectId = Guid.Parse("33333333-3333-3333-3333-333333333333"),
        };

        ItsmOutboundIntegrationHealthReport report =
            await sut.GetStoredHealthAsync(scope, CancellationToken.None);

        report.Status.Should().Be("not_tested");
        report.Return503.Should().BeFalse();
        report.Jira.LocallyConfigured.Should().BeTrue();
        report.Jira.Reachable.Should().BeNull();

        factory.Verify(f => f.CreateClient(It.IsAny<string>()), Times.Never);
    }

    [Fact]
    public async Task GetHealthAsync_when_jira_configured_and_myself_ok_marks_reachable()
    {
        IntegrationsItsmOutboundOptions options = new()
        {
            Jira =
            {
                CloudBaseUrl = "https://mock-jira.health.test",
                ServiceAccountEmail = "bot@example.com",
                ApiToken = "token",
                DefaultProjectKey = "DP",
            },
        };

        Mock<IOptionsMonitor<IntegrationsItsmOutboundOptions>> monitor = new();
        monitor.Setup(static m => m.CurrentValue).Returns(options);

        Mock<ITenantItsmOutboundSettingsRepository> tenantRepo = new();
        tenantRepo
            .Setup(t => t.TryGetAsync(TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new TenantItsmOutboundSettings());

        using HttpClient innerHttp = new(new StubHandler(static (request, _) =>
        {
            request.RequestUri!.AbsolutePath.Should().Be("/rest/api/3/myself");
            AuthenticationHeaderValue? auth = request.Headers.Authorization;
            auth.Should().NotBeNull();
            auth!.Scheme.Should().Be("Basic");
            byte[] decoded = Convert.FromBase64String(auth.Parameter ?? "");
            Encoding.UTF8.GetString(decoded).Should().Be("bot@example.com:token");

            return new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent("""{"accountId":"x"}""", Encoding.UTF8, "application/json"),
            };
        }));

        Mock<IHttpClientFactory> factory = new();
        factory
            .Setup(f => f.CreateClient(ItsmOutboundIntegrationHealthLimits.JiraHttpClientName))
            .Returns(innerHttp);

        ItsmOutboundIntegrationHealthService sut = new(
            factory.Object,
            monitor.Object,
            tenantRepo.Object,
            CredentialResolver(options),
            HttpAuthenticator(),
            NullLogger<ItsmOutboundIntegrationHealthService>.Instance);

        ScopeContext scope = new()
        {
            TenantId = TenantId,
            WorkspaceId = Guid.Parse("22222222-2222-2222-2222-222222222222"),
            ProjectId = Guid.Parse("33333333-3333-3333-3333-333333333333"),
        };

        ItsmOutboundIntegrationHealthReport report =
            await sut.GetHealthAsync(scope, CancellationToken.None);

        report.Jira.LocallyConfigured.Should().BeTrue();
        report.Jira.Reachable.Should().BeTrue();
        report.ServiceNow.LocallyConfigured.Should().BeFalse();
        report.Status.Should().Be("healthy");
        report.Return503.Should().BeFalse();
    }

    [Fact]
    public async Task GetHealthAsync_when_jira_configured_and_upstream_401_sets_return_503()
    {
        IntegrationsItsmOutboundOptions options = new()
        {
            Jira =
            {
                CloudBaseUrl = "https://mock-jira.health.test",
                ServiceAccountEmail = "bot@example.com",
                ApiToken = "bad",
                DefaultProjectKey = "DP",
            },
        };

        Mock<IOptionsMonitor<IntegrationsItsmOutboundOptions>> monitor = new();
        monitor.Setup(static m => m.CurrentValue).Returns(options);

        Mock<ITenantItsmOutboundSettingsRepository> tenantRepo = new();
        tenantRepo
            .Setup(t => t.TryGetAsync(TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((TenantItsmOutboundSettings?)null);

        using HttpClient innerHttp = new(new StubHandler(static (_, _) =>
            new HttpResponseMessage(HttpStatusCode.Unauthorized)
            {
                Content = new StringContent("no", Encoding.UTF8, "application/json"),
            }));

        Mock<IHttpClientFactory> factory = new();
        factory
            .Setup(f => f.CreateClient(ItsmOutboundIntegrationHealthLimits.JiraHttpClientName))
            .Returns(innerHttp);

        ItsmOutboundIntegrationHealthService sut = new(
            factory.Object,
            monitor.Object,
            tenantRepo.Object,
            CredentialResolver(options),
            HttpAuthenticator(),
            NullLogger<ItsmOutboundIntegrationHealthService>.Instance);

        ScopeContext scope = new()
        {
            TenantId = TenantId,
            WorkspaceId = Guid.Parse("22222222-2222-2222-2222-222222222222"),
            ProjectId = Guid.Parse("33333333-3333-3333-3333-333333333333"),
        };

        ItsmOutboundIntegrationHealthReport report =
            await sut.GetHealthAsync(scope, CancellationToken.None);

        report.Status.Should().Be("unhealthy");
        report.Return503.Should().BeTrue();
        report.Jira.Reachable.Should().BeFalse();
    }

    [Fact]
    public async Task GetHealthAsync_routes_both_probes_to_their_named_clients()
    {
        IntegrationsItsmOutboundOptions options = OutboundServiceNowConfigured();
        options.Jira.CloudBaseUrl = "https://mock-jira.health.test";
        options.Jira.ServiceAccountEmail = "bot@example.com";
        options.Jira.ApiToken = "token";
        options.Jira.DefaultProjectKey = "DP";

        Mock<ITenantItsmOutboundSettingsRepository> tenantRepo = new();
        tenantRepo
            .Setup(t => t.TryGetAsync(TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((TenantItsmOutboundSettings?)null);

        using HttpClient jiraHttp = new(new StubHandler(static (request, _) =>
        {
            Assert.Equal(HttpMethod.Get, request.Method);
            Assert.Equal("/rest/api/3/myself", request.RequestUri!.AbsolutePath);
            return new HttpResponseMessage(HttpStatusCode.TooManyRequests);
        }));
        using HttpClient serviceNowHttp = new(new StubHandler(static (request, _) =>
        {
            Assert.Equal(HttpMethod.Get, request.Method);
            Assert.Equal("/api/now/table/incident", request.RequestUri!.AbsolutePath);
            return new HttpResponseMessage(HttpStatusCode.OK);
        }));

        Mock<IHttpClientFactory> factory = new(MockBehavior.Strict);
        factory.Setup(f => f.CreateClient(ItsmOutboundIntegrationHealthLimits.JiraHttpClientName)).Returns(jiraHttp);
        factory.Setup(f => f.CreateClient(ItsmOutboundIntegrationHealthLimits.ServiceNowHttpClientName)).Returns(serviceNowHttp);

        ItsmOutboundIntegrationHealthService sut = new(
            factory.Object,
            Monitor(options).Object,
            tenantRepo.Object,
            CredentialResolver(options),
            HttpAuthenticator(),
            NullLogger<ItsmOutboundIntegrationHealthService>.Instance);

        ItsmOutboundIntegrationHealthReport report = await sut.GetHealthAsync(
            new ScopeContext { TenantId = TenantId },
            CancellationToken.None);

        report.Jira.Reachable.Should().BeFalse();
        report.ServiceNow.Reachable.Should().BeTrue();
        report.Return503.Should().BeTrue();
        factory.Verify(f => f.CreateClient(ItsmOutboundIntegrationHealthLimits.JiraHttpClientName), Times.Once);
        factory.Verify(f => f.CreateClient(ItsmOutboundIntegrationHealthLimits.ServiceNowHttpClientName), Times.Once);
    }

    [Theory]
    [InlineData(false)]
    [InlineData(true)]
    public async Task GetHealthAsync_propagates_caller_cancellation_in_either_vendor_probe(bool cancelInServiceNow)
    {
        IntegrationsItsmOutboundOptions options = OutboundServiceNowConfigured();
        options.Jira.CloudBaseUrl = "https://mock-jira.health.test";
        options.Jira.ServiceAccountEmail = "bot@example.com";
        options.Jira.ApiToken = "token";
        options.Jira.DefaultProjectKey = "DP";

        Mock<ITenantItsmOutboundSettingsRepository> tenantRepo = new();
        tenantRepo
            .Setup(t => t.TryGetAsync(TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((TenantItsmOutboundSettings?)null);

        using CancellationTokenSource caller = new();
        using HttpClient jiraHttp = new(new StubHandler((_, token) =>
        {
            if (!cancelInServiceNow)
            {
                caller.Cancel();
                token.ThrowIfCancellationRequested();
            }

            return new HttpResponseMessage(HttpStatusCode.OK);
        }));
        using HttpClient serviceNowHttp = new(new StubHandler((_, token) =>
        {
            caller.Cancel();
            token.ThrowIfCancellationRequested();
            return new HttpResponseMessage(HttpStatusCode.OK);
        }));

        Mock<IHttpClientFactory> factory = new(MockBehavior.Strict);
        factory.Setup(f => f.CreateClient(ItsmOutboundIntegrationHealthLimits.JiraHttpClientName)).Returns(jiraHttp);
        factory.Setup(f => f.CreateClient(ItsmOutboundIntegrationHealthLimits.ServiceNowHttpClientName)).Returns(serviceNowHttp);
        ItsmOutboundIntegrationHealthService sut = new(
            factory.Object, Monitor(options).Object, tenantRepo.Object,
            CredentialResolver(options), HttpAuthenticator(),
            NullLogger<ItsmOutboundIntegrationHealthService>.Instance);

        await Assert.ThrowsAnyAsync<OperationCanceledException>(() =>
            sut.GetHealthAsync(new ScopeContext { TenantId = TenantId }, caller.Token));

        factory.Verify(f => f.CreateClient(ItsmOutboundIntegrationHealthLimits.JiraHttpClientName), Times.Once);
        factory.Verify(f => f.CreateClient(ItsmOutboundIntegrationHealthLimits.ServiceNowHttpClientName),
            cancelInServiceNow ? Times.Once() : Times.Never());
    }

    [Fact]
    public async Task GetHealthAsync_when_transport_times_out_without_caller_cancellation_reports_unhealthy()
    {
        IntegrationsItsmOutboundOptions options = new()
        {
            Jira =
            {
                CloudBaseUrl = "https://mock-jira.health.test",
                ServiceAccountEmail = "bot@example.com",
                ApiToken = "token",
                DefaultProjectKey = "DP",
            },
        };

        Mock<ITenantItsmOutboundSettingsRepository> tenantRepo = new();
        tenantRepo
            .Setup(t => t.TryGetAsync(TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((TenantItsmOutboundSettings?)null);

        using HttpClient jiraHttp = new(new StubHandler(static (_, _) =>
            throw new TaskCanceledException("Simulated request timeout.")));
        Mock<IHttpClientFactory> factory = new(MockBehavior.Strict);
        factory.Setup(f => f.CreateClient(ItsmOutboundIntegrationHealthLimits.JiraHttpClientName)).Returns(jiraHttp);
        ItsmOutboundIntegrationHealthService sut = new(
            factory.Object, Monitor(options).Object, tenantRepo.Object,
            CredentialResolver(options), HttpAuthenticator(),
            NullLogger<ItsmOutboundIntegrationHealthService>.Instance);

        ItsmOutboundIntegrationHealthReport report =
            await sut.GetHealthAsync(new ScopeContext { TenantId = TenantId }, CancellationToken.None);

        report.Status.Should().Be("unhealthy");
        report.Return503.Should().BeTrue();
        report.Jira.Reachable.Should().BeFalse();
        report.Jira.Summary.Should().Be("Jira health probe timed out.");
    }

    private sealed class StubHandler : HttpMessageHandler
    {
        private readonly Func<HttpRequestMessage, CancellationToken, HttpResponseMessage> _handler;

        public StubHandler(Func<HttpRequestMessage, CancellationToken, HttpResponseMessage> handler) =>
            _handler = handler ?? throw new ArgumentNullException(nameof(handler));

        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken) =>
            Task.FromResult(_handler(request, cancellationToken));
    }
}
