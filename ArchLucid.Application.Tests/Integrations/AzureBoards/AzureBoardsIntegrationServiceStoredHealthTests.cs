using ArchLucid.Application.Integrations.AzureBoards;
using ArchLucid.Application.Integrations.AzureBoards.Outbound;
using ArchLucid.Application.Integrations.Itsm;
using ArchLucid.Application.Integrations.Itsm.Outbound;
using ArchLucid.Core.Integrations.Itsm;
using ArchLucid.Core.Persistence.ApplicationPorts.Integrations;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;

using Moq;

namespace ArchLucid.Application.Tests.Integrations.AzureBoards;

[Trait("Category", "Unit")]
public sealed class AzureBoardsIntegrationServiceStoredHealthTests
{
    [Fact]
    public async Task GetStoredHealthAsync_reads_sql_rows_and_does_not_probe_azure()
    {
        Guid tenantId = Guid.Parse("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee");
        Mock<ITenantItsmConnectorConnectionRepository> connections = new();
        connections
            .Setup(c => c.GetAsync(tenantId, TenantItsmConnectorProvider.AzureBoards, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new TenantItsmConnectorConnectionRecord
            {
                TenantId = tenantId,
                Provider = TenantItsmConnectorProvider.AzureBoards,
                InstanceBaseUrl = "https://dev.azure.com/example",
                CredentialKeyVaultSecretName = "kv-pat",
            });

        Mock<ITenantAzureBoardsOutboundSettingsRepository> settings = new();
        settings
            .Setup(s => s.TryGetAsync(tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new TenantAzureBoardsOutboundSettings
            {
                LastConnectionTestUtc = DateTime.UtcNow,
                LastConnectionTestSummary = "Azure Boards reachable (1 project(s) discovered).",
            });

        AzureBoardsOutboundIssueClient azureClient = new(new HttpClient(), NullLogger<AzureBoardsOutboundIssueClient>.Instance);
        AzureBoardsIntegrationService sut = new(
            Mock.Of<IItsmTenantConnectorCredentialResolver>(),
            settings.Object,
            connections.Object,
            azureClient,
            Mock.Of<IItsmOutboundHttpAuthenticator>());

        AzureBoardsStoredHealth health = await sut.GetStoredHealthAsync(tenantId, CancellationToken.None);

        health.Status.Should().Be(AzureBoardsStoredHealthStatuses.Healthy);
        health.Reachable.Should().BeTrue();
        connections.Verify(
            c => c.GetAsync(tenantId, TenantItsmConnectorProvider.AzureBoards, It.IsAny<CancellationToken>()),
            Times.Once);
        settings.Verify(s => s.TryGetAsync(tenantId, It.IsAny<CancellationToken>()), Times.Once);
    }
}
