using ArchLucid.Application.Integrations.Itsm.Outbound;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Integrations.Itsm.Outbound;
[Trait("Category", "Unit")]

public sealed class ItsmOutboundLocalConfigurationEvaluatorTests
{
    [Theory]
    [InlineData("https://example.atlassian.net")]
    [InlineData("http://127.0.0.1")]
    [InlineData("http://localhost")]
    [InlineData("http://[::1]")]
    public void TryValidateItsmOutboundVendorBaseUrl_accepts_https_and_loopback_http(string url) =>
        ItsmOutboundLocalConfigurationEvaluator.TryValidateItsmOutboundVendorBaseUrl(url).Should().BeTrue();

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData("ftp://127.0.0.1")]
    [InlineData("http://192.168.1.1")]
    [InlineData("http://example.test")]
    public void TryValidateItsmOutboundVendorBaseUrl_rejects_invalid_or_non_loopback_http(string url) =>
        ItsmOutboundLocalConfigurationEvaluator.TryValidateItsmOutboundVendorBaseUrl(url).Should().BeFalse();

    [Fact]
    public void TryValidateHttpsUrl_allows_only_https() =>
        ItsmOutboundLocalConfigurationEvaluator.TryValidateHttpsUrl("http://127.0.0.1").Should().BeFalse();

    [Fact]
    public void EvaluateAzureBoards_requires_org_credentials_project_and_work_item_type()
    {
        ArchLucid.Core.Configuration.IntegrationsItsmOutboundOptions options = new();

        ItsmOutboundLocalReadiness incomplete =
            ItsmOutboundLocalConfigurationEvaluator.EvaluateAzureBoards(options, null, null);

        incomplete.IsReady.Should().BeFalse();

        ArchLucid.Core.Persistence.ApplicationPorts.Integrations.TenantItsmConnectorConnectionRecord connection =
            new()
            {
                Provider = ArchLucid.Core.Integrations.Itsm.TenantItsmConnectorProvider.AzureBoards,
                InstanceBaseUrl = "https://dev.azure.com/example",
                CredentialKeyVaultSecretName = "kv-pat",
                IsEnabled = true,
            };

        ArchLucid.Core.Persistence.ApplicationPorts.Integrations.TenantAzureBoardsOutboundSettings settings = new()
        {
            ProjectName = "Pilot",
            DefaultWorkItemType = "Issue",
        };

        ItsmOutboundLocalReadiness ready =
            ItsmOutboundLocalConfigurationEvaluator.EvaluateAzureBoards(options, connection, settings);

        ready.IsReady.Should().BeTrue();
    }
}
