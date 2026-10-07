using System.Text;

using ArchLucid.Application.Integrations.Itsm;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Integrations.Itsm;
using ArchLucid.Persistence.Integrations;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Application.Tests.Integrations.Itsm;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ItsmInboundWebhookFacadeTests
{
    private const string SharedSecret = "test-inbound-secret";

    [Fact]
    public async Task ProcessAsync_returns_unauthorized_when_unscoped_and_deployment_wide_secrets_disabled()
    {
        const string body = """{"issue":{"key":"PROJ-1","fields":{"status":{"name":"Done"}}}}""";

        Mock<IOptionsMonitor<IntegrationsItsmInboundOptions>> options = new();
        options.Setup(m => m.CurrentValue).Returns(new IntegrationsItsmInboundOptions
        {
            AllowDeploymentWideWebhookSecrets = false,
            JiraWebhookSecret = SharedSecret,
        });

        Mock<IItsmTenantConnectorCredentialResolver> credentials = new(MockBehavior.Strict);
        ItsmInboundWebhookSyncService sync = CreateSyncService();

        ItsmInboundWebhookFacade sut = new(options.Object, credentials.Object, sync);

        ItsmInboundWebhookProcessHttpResult result = await sut.ProcessAsync(
            new ItsmInboundWebhookProcessRequest
            {
                Provider = TenantItsmConnectorProvider.Jira,
                TenantId = null,
                RawBody = body,
                PayloadUtf8Bytes = Encoding.UTF8.GetByteCount(body),
                VendorToken = SharedSecret,
            },
            CancellationToken.None);

        result.Outcome.Should().Be(ItsmInboundWebhookHttpOutcome.Unauthorized);
    }

    [Fact]
    public async Task ProcessAsync_returns_unauthorized_when_timestamp_skew_enabled_and_header_is_malformed()
    {
        const string body = """{"issue":{"key":"PROJ-1","fields":{"status":{"name":"Done"}}}}""";

        Mock<IOptionsMonitor<IntegrationsItsmInboundOptions>> options = new();
        options.Setup(m => m.CurrentValue).Returns(new IntegrationsItsmInboundOptions
        {
            AllowDeploymentWideWebhookSecrets = true,
            JiraWebhookSecret = SharedSecret,
            WebhookTimestampSkewSeconds = 120,
        });

        Mock<IItsmTenantConnectorCredentialResolver> credentials = new(MockBehavior.Strict);
        ItsmInboundWebhookSyncService sync = CreateSyncService();

        ItsmInboundWebhookFacade sut = new(options.Object, credentials.Object, sync);

        ItsmInboundWebhookProcessHttpResult result = await sut.ProcessAsync(
            new ItsmInboundWebhookProcessRequest
            {
                Provider = TenantItsmConnectorProvider.Jira,
                TenantId = null,
                RawBody = body,
                PayloadUtf8Bytes = Encoding.UTF8.GetByteCount(body),
                VendorToken = SharedSecret,
                TimestampHeader = "not-unix-seconds",
            },
            CancellationToken.None);

        result.Outcome.Should().Be(ItsmInboundWebhookHttpOutcome.Unauthorized);
    }

    [Fact]
    public async Task ProcessAsync_returns_unauthorized_when_hmac_required_and_signature_missing()
    {
        const string body = """{"issue":{"key":"PROJ-1","fields":{"status":{"name":"Done"}}}}""";

        Mock<IOptionsMonitor<IntegrationsItsmInboundOptions>> options = new();
        options.Setup(m => m.CurrentValue).Returns(new IntegrationsItsmInboundOptions
        {
            AllowDeploymentWideWebhookSecrets = true,
            JiraWebhookSecret = SharedSecret,
            RequireBodyHmacSignature = true,
        });

        Mock<IItsmTenantConnectorCredentialResolver> credentials = new(MockBehavior.Strict);
        ItsmInboundWebhookSyncService sync = CreateSyncService();

        ItsmInboundWebhookFacade sut = new(options.Object, credentials.Object, sync);

        ItsmInboundWebhookProcessHttpResult result = await sut.ProcessAsync(
            new ItsmInboundWebhookProcessRequest
            {
                Provider = TenantItsmConnectorProvider.Jira,
                TenantId = null,
                RawBody = body,
                PayloadUtf8Bytes = Encoding.UTF8.GetByteCount(body),
                VendorToken = SharedSecret,
            },
            CancellationToken.None);

        result.Outcome.Should().Be(ItsmInboundWebhookHttpOutcome.Unauthorized);
    }

    [Fact]
    public async Task ProcessAsync_skips_timestamp_skew_when_header_is_whitespace_only()
    {
        const string body = """{"issue":{"key":"PROJ-1","fields":{"status":{"name":"Done"}}}}""";

        Mock<IOptionsMonitor<IntegrationsItsmInboundOptions>> options = new();
        options.Setup(m => m.CurrentValue).Returns(new IntegrationsItsmInboundOptions
        {
            AllowDeploymentWideWebhookSecrets = true,
            JiraWebhookSecret = SharedSecret,
            WebhookTimestampSkewSeconds = 120,
        });

        Mock<IItsmTenantConnectorCredentialResolver> credentials = new(MockBehavior.Strict);
        ItsmInboundWebhookSyncService sync = CreateSyncService();

        ItsmInboundWebhookFacade sut = new(options.Object, credentials.Object, sync);

        ItsmInboundWebhookProcessHttpResult result = await sut.ProcessAsync(
            new ItsmInboundWebhookProcessRequest
            {
                Provider = TenantItsmConnectorProvider.Jira,
                TenantId = null,
                RawBody = body,
                PayloadUtf8Bytes = Encoding.UTF8.GetByteCount(body),
                VendorToken = SharedSecret,
                TimestampHeader = "   ",
            },
            CancellationToken.None);

        result.Outcome.Should().NotBe(ItsmInboundWebhookHttpOutcome.Unauthorized);
    }

    [Fact]
    public async Task ProcessAsync_returns_unauthorized_when_tenant_scoped_and_inbound_secret_missing()
    {
        Guid tenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
        const string body = """{"issue":{"key":"PROJ-1","fields":{"status":{"name":"Done"}}}}""";

        Mock<IOptionsMonitor<IntegrationsItsmInboundOptions>> options = new();
        options.Setup(m => m.CurrentValue).Returns(new IntegrationsItsmInboundOptions
        {
            AllowDeploymentWideWebhookSecrets = false,
        });

        Mock<IItsmTenantConnectorCredentialResolver> credentials = new();
        credentials
            .Setup(c => c.TryResolveInboundWebhookSecretAsync(tenantId, TenantItsmConnectorProvider.Jira, It.IsAny<CancellationToken>()))
            .ReturnsAsync((string?)null);

        ItsmInboundWebhookSyncService sync = CreateSyncService();
        ItsmInboundWebhookFacade sut = new(options.Object, credentials.Object, sync);

        ItsmInboundWebhookProcessHttpResult result = await sut.ProcessAsync(
            new ItsmInboundWebhookProcessRequest
            {
                Provider = TenantItsmConnectorProvider.Jira,
                TenantId = tenantId,
                RawBody = body,
                PayloadUtf8Bytes = Encoding.UTF8.GetByteCount(body),
                VendorToken = "any-token",
            },
            CancellationToken.None);

        result.Outcome.Should().Be(ItsmInboundWebhookHttpOutcome.Unauthorized);
    }

    private static ItsmInboundWebhookSyncService CreateSyncService()
    {
        Mock<IItsmFindingCorrelationRepository> correlations = new();
        Mock<IItsmInboundWebhookReplayGuard> replay = new();
        replay
            .Setup(g => g.TryClaimAsync(It.IsAny<Guid>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        Mock<IOptionsMonitor<IntegrationsItsmInboundOptions>> inboundOptions = new();
        inboundOptions.Setup(m => m.CurrentValue).Returns(new IntegrationsItsmInboundOptions());

        ItsmInboundWebhookProcessPipeline pipeline = new(
            new ItsmInboundWebhookSyncSupport(correlations.Object, replay.Object),
            inboundOptions.Object,
            new ItsmInboundDispositionSync(Mock.Of<ArchLucid.Application.Governance.FindingDisposition.IFindingDispositionService>(), NullLogger<ItsmInboundDispositionSync>.Instance),
            Mock.Of<ArchLucid.Persistence.Interfaces.IFindingInspectReadRepository>(),
            Mock.Of<ArchLucid.Persistence.Queries.IAuthorityQueryService>(),
            Mock.Of<ArchLucid.Core.Manifest.IManifestHashService>(),
            NullLogger<ItsmInboundWebhookProcessPipeline>.Instance);

        ItsmInboundJiraWebhookProcessor jiraProcessor = new(
            pipeline,
            new ItsmInboundJiraPayloadReader(),
            new ItsmInboundJiraStatusMapper());

        ItsmInboundServiceNowWebhookProcessor serviceNowProcessor = new(
            pipeline,
            new ItsmInboundServiceNowPayloadReader(),
            new ItsmInboundServiceNowStatusMapper());

        return new ItsmInboundWebhookSyncService(jiraProcessor, serviceNowProcessor);
    }
}
