using ArchLucid.Application.Integrations.AzureBoards;
using ArchLucid.Core.Integrations.Itsm;
using ArchLucid.Core.Persistence.ApplicationPorts.Integrations;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Integrations.AzureBoards;

[Trait("Category", "Unit")]
public sealed class AzureBoardsStoredHealthMapperTests
{
    [Fact]
    public void AreCredentialsConfigured_requires_organization_and_secret_name()
    {
        AzureBoardsStoredHealthMapper.AreCredentialsConfigured(null).Should().BeFalse();

        AzureBoardsStoredHealthMapper
            .AreCredentialsConfigured(new TenantItsmConnectorConnectionRecord
            {
                Provider = TenantItsmConnectorProvider.AzureBoards,
                InstanceBaseUrl = "https://dev.azure.com/example",
                CredentialKeyVaultSecretName = "",
            })
            .Should()
            .BeFalse();

        AzureBoardsStoredHealthMapper
            .AreCredentialsConfigured(new TenantItsmConnectorConnectionRecord
            {
                Provider = TenantItsmConnectorProvider.AzureBoards,
                InstanceBaseUrl = "https://dev.azure.com/example",
                CredentialKeyVaultSecretName = "kv-pat",
            })
            .Should()
            .BeTrue();
    }

    [Fact]
    public void Map_returns_not_configured_when_credentials_and_last_test_are_missing()
    {
        AzureBoardsStoredHealth health = AzureBoardsStoredHealthMapper.Map(false, null);

        health.Status.Should().Be(AzureBoardsStoredHealthStatuses.NotConfigured);
        health.Reachable.Should().BeFalse();
        health.Summary.Should().Contain("not configured");
        health.StatusCode.Should().BeNull();
    }

    [Fact]
    public void Map_returns_not_tested_when_credentials_exist_without_a_last_test()
    {
        AzureBoardsStoredHealth health = AzureBoardsStoredHealthMapper.Map(
            true,
            new TenantAzureBoardsOutboundSettings { ProjectName = "Pilot", DefaultWorkItemType = "Issue" });

        health.Status.Should().Be(AzureBoardsStoredHealthStatuses.NotTested);
        health.Reachable.Should().BeFalse();
        health.Summary.Should().Contain("have not been validated");
    }

    [Fact]
    public void Map_returns_healthy_from_last_successful_test()
    {
        AzureBoardsStoredHealth health = AzureBoardsStoredHealthMapper.Map(
            true,
            new TenantAzureBoardsOutboundSettings
            {
                LastConnectionTestUtc = DateTime.UtcNow,
                LastConnectionTestSummary = "Azure Boards reachable (1 project(s) discovered).",
            });

        health.Status.Should().Be(AzureBoardsStoredHealthStatuses.Healthy);
        health.Reachable.Should().BeTrue();
        health.Summary.Should().Contain("reachable");
    }

    [Fact]
    public void Map_returns_unhealthy_from_last_failed_test()
    {
        AzureBoardsStoredHealth health = AzureBoardsStoredHealthMapper.Map(
            true,
            new TenantAzureBoardsOutboundSettings
            {
                LastConnectionTestUtc = DateTime.UtcNow,
                LastConnectionTestSummary = "Azure Boards connection test failed.",
            });

        health.Status.Should().Be(AzureBoardsStoredHealthStatuses.Unhealthy);
        health.Reachable.Should().BeFalse();
        health.Summary.Should().Contain("failed");
    }

    [Fact]
    public void Map_uses_fallback_summary_when_failed_test_copy_is_blank()
    {
        AzureBoardsStoredHealth unhealthy = AzureBoardsStoredHealthMapper.Map(
            false,
            new TenantAzureBoardsOutboundSettings
            {
                LastConnectionTestUtc = DateTime.UtcNow,
                LastConnectionTestSummary = "   ",
            });

        unhealthy.Status.Should().Be(AzureBoardsStoredHealthStatuses.Unhealthy);
        unhealthy.Summary.Should().Be("Azure Boards connection test failed.");
    }
}
