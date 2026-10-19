using ArchLucid.Core.AzureExtractor;

using ArchLucid.Integrations.AzureExtractor;

using Microsoft.Extensions.Logging.Abstractions;

using Xunit;

namespace ArchLucid.Integrations.AzureExtractor.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Integrations.AzureExtractor")]
public sealed class HostedAzureInventoryDiagramEnrichmentCollectorTests
{
    [Fact]
    public async Task CollectAsync_when_app_settings_hosts_disabled_emits_get_only_warning()
    {
        using HttpClient httpClient = new();
        GetOnlyHostedAzureArmReadClient armReadClient = new(
            httpClient,
            NullLogger<GetOnlyHostedAzureArmReadClient>.Instance);

        HostedAzureDiagramEnrichmentCollectResult result =
            await HostedAzureInventoryDiagramEnrichmentCollector.CollectAsync(
                armReadClient,
                "token",
                "11111111-1111-1111-1111-111111111111",
                [],
                includeAppSettingsHosts: false,
                NullLogger.Instance,
                CancellationToken.None);

        Assert.Contains(
            AzureInventoryRelationshipCompletenessWarningCodes.AppSettingsNotCollectedHostedGetOnly,
            result.CollectionWarnings);
    }

    [Fact]
    public async Task CollectAsync_when_app_settings_hosts_enabled_omits_get_only_warning()
    {
        using HttpClient httpClient = new();
        GetOnlyHostedAzureArmReadClient armReadClient = new(
            httpClient,
            NullLogger<GetOnlyHostedAzureArmReadClient>.Instance);

        HostedAzureDiagramEnrichmentCollectResult result =
            await HostedAzureInventoryDiagramEnrichmentCollector.CollectAsync(
                armReadClient,
                "token",
                "11111111-1111-1111-1111-111111111111",
                [],
                includeAppSettingsHosts: true,
                NullLogger.Instance,
                CancellationToken.None);

        Assert.DoesNotContain(
            AzureInventoryRelationshipCompletenessWarningCodes.AppSettingsNotCollectedHostedGetOnly,
            result.CollectionWarnings);
    }
}
