using System.Net;

using Microsoft.Extensions.Logging.Abstractions;

using Xunit;

namespace ArchLucid.Integrations.AzureExtractor.Tests;

public sealed class GetOnlyHostedAzureArmReadClientTests
{
    [Fact]
    public async Task ListSubscriptionResourcesAsync_uses_get_only_against_management_azure_com()
    {
        List<string> methods = [];

        HttpMessageHandler handler = new RecordingHandler(
            (request, _) =>
            {
                methods.Add(request.Method.Method);

                Assert.StartsWith("https://management.azure.com/", request.RequestUri?.AbsoluteUri);
                Assert.Equal("Bearer", request.Headers.Authorization?.Scheme);
                Assert.Equal("token-abc", request.Headers.Authorization?.Parameter);

                const string body = """
                                    {
                                      "value": [
                                        {
                                          "id": "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/sa1",
                                          "name": "sa1",
                                          "type": "Microsoft.Storage/storageAccounts",
                                          "location": "eastus",
                                          "properties": { "provisioningState": "Succeeded" }
                                        }
                                      ]
                                    }
                                    """;

                return Task.FromResult(
                    new HttpResponseMessage(HttpStatusCode.OK)
                    {
                        Content = new StringContent(body)
                    });
            });

        HttpClient httpClient = new(handler);
        GetOnlyHostedAzureArmReadClient client = new(httpClient, NullLogger<GetOnlyHostedAzureArmReadClient>.Instance);

        IReadOnlyList<HostedAzureArmResourceRecord> resources = await client.ListSubscriptionResourcesAsync(
            "token-abc",
            "11111111-1111-1111-1111-111111111111",
            CancellationToken.None);

        Assert.All(methods, method => Assert.Equal(HttpMethod.Get.Method, method));
        Assert.Single(resources);
        Assert.Equal("Microsoft.Storage/storageAccounts", resources[0].ResourceType);
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
