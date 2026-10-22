using System.Net;

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

    [Fact]
    public async Task CollectAsync_surfaces_partial_child_enumeration_when_event_grid_listing_is_partial()
    {
        const string topicResourceId =
            "/subscriptions/11111111-1111-1111-1111-111111111111/resourceGroups/rg/providers/Microsoft.EventGrid/topics/topic1";
        const string nextLink =
            $"https://management.azure.com{topicResourceId}/eventSubscriptions?api-version=2022-06-15&$skiptoken=page2";

        string firstPageBody = """
                               {
                                 "value": [
                                   {
                                     "name": "sub1",
                                     "id": "/subscriptions/11111111-1111-1111-1111-111111111111/resourceGroups/rg/providers/Microsoft.EventGrid/topics/topic1/providers/Microsoft.EventGrid/eventSubscriptions/sub1",
                                     "properties": {
                                       "destination": {
                                         "endpointType": "StorageQueue",
                                         "resourceId": "/subscriptions/11111111-1111-1111-1111-111111111111/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/sa1"
                                       }
                                     }
                                   }
                                 ],
                                 "nextLink": "EVENT_GRID_NEXT_LINK"
                               }
                               """.Replace("EVENT_GRID_NEXT_LINK", nextLink, StringComparison.Ordinal);

        int requestCount = 0;

        HttpMessageHandler handler = new RecordingHandler(
            (_, _) =>
            {
                int current = Interlocked.Increment(ref requestCount);

                if (current <= 2)
                {
                    return Task.FromResult(
                        new HttpResponseMessage(HttpStatusCode.OK)
                        {
                            Content = new StringContent(firstPageBody)
                        });
                }

                return Task.FromResult(new HttpResponseMessage(HttpStatusCode.InternalServerError));
            });

        GetOnlyHostedAzureArmReadClient armReadClient = new(
            new HttpClient(handler),
            NullLogger<GetOnlyHostedAzureArmReadClient>.Instance);

        HostedAzureArmResourceRecord topic = new(
            "Microsoft.EventGrid/topics",
            topicResourceId,
            "topic1",
            "eastus",
            null,
            null,
            new Dictionary<string, object?>());

        HostedAzureDiagramEnrichmentCollectResult result =
            await HostedAzureInventoryDiagramEnrichmentCollector.CollectAsync(
                armReadClient,
                "token",
                "11111111-1111-1111-1111-111111111111",
                [topic],
                includeAppSettingsHosts: true,
                NullLogger.Instance,
                CancellationToken.None);

        Assert.Contains(
            AzureInventoryPaasChildCompletenessWarningCodes.PartialChildEnumeration,
            result.CollectionWarnings);
    }

    private sealed class RecordingHandler(Func<HttpRequestMessage, CancellationToken, Task<HttpResponseMessage>> responder)
        : HttpMessageHandler
    {
        protected override Task<HttpResponseMessage> SendAsync(
            HttpRequestMessage request,
            CancellationToken cancellationToken) =>
            responder(request, cancellationToken);
    }
}
