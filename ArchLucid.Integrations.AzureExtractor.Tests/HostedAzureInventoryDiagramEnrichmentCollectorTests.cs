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

    [Theory]
    [InlineData(403)]
    [InlineData(500)]
    [InlineData(0)]
    public async Task EventGrid_collection_failure_is_not_an_empty_success(int status)
    {
        const string topicId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.EventGrid/topics/topic1";

        using HttpMessageHandler handler = new RecordingHandler(
            (_, _) => status == 0
                ? Task.FromException<HttpResponseMessage>(new HttpRequestException("Collection failed"))
                : Task.FromResult(new HttpResponseMessage((HttpStatusCode)status)));
        using HttpClient httpClient = new(handler);
        GetOnlyHostedAzureArmReadClient client = new(
            httpClient,
            NullLogger<GetOnlyHostedAzureArmReadClient>.Instance);
        HostedAzureArmResourceRecord topic = new(
            "Microsoft.EventGrid/topics", topicId, "topic1", "eastus",
            null, null, new Dictionary<string, object?>());

        HostedAzureInventoryEventGridSubscriptionCollectResult result =
            await HostedAzureInventoryEventGridSubscriptionCollector.CollectAsync(
                client, "token", null, [topic], NullLogger.Instance, CancellationToken.None);

        Assert.Empty(result.Subscriptions);
        Assert.Contains(AzureInventoryPaasChildCompletenessWarningCodes.PartialChildEnumeration,
            result.CollectionWarnings);
    }

    [Theory]
    [InlineData(403)]
    [InlineData(500)]
    public async Task EventGrid_subscription_scope_failure_is_reported(int status)
    {
        using HttpMessageHandler handler = new RecordingHandler(
            (_, _) => Task.FromResult(new HttpResponseMessage((HttpStatusCode)status)));
        using HttpClient httpClient = new(handler);
        GetOnlyHostedAzureArmReadClient client = new(
            httpClient,
            NullLogger<GetOnlyHostedAzureArmReadClient>.Instance);

        HostedAzureInventoryEventGridSubscriptionCollectResult result =
            await HostedAzureInventoryEventGridSubscriptionCollector.CollectAsync(
                client, "token", "sub", [], NullLogger.Instance, CancellationToken.None);

        Assert.Empty(result.Subscriptions);
        Assert.Contains(AzureInventoryPaasChildCompletenessWarningCodes.PartialChildEnumeration,
            result.CollectionWarnings);
    }

    [Fact]
    public async Task EventGrid_successful_empty_list_has_no_completeness_warning()
    {
        using HttpMessageHandler handler = new RecordingHandler(
            (_, _) => Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent("{\"value\":[]}")
            }));
        using HttpClient httpClient = new(handler);
        GetOnlyHostedAzureArmReadClient client = new(
            httpClient,
            NullLogger<GetOnlyHostedAzureArmReadClient>.Instance);

        HostedAzureInventoryEventGridSubscriptionCollectResult result =
            await HostedAzureInventoryEventGridSubscriptionCollector.CollectAsync(
                client, "token", "sub", [], NullLogger.Instance, CancellationToken.None);

        Assert.Empty(result.Subscriptions);
        Assert.Empty(result.CollectionWarnings);
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
