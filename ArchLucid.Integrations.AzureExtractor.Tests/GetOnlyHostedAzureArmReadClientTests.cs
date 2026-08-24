using System.Net;

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Logging.Abstractions;

using Moq;

using Xunit;

namespace ArchLucid.Integrations.AzureExtractor.Tests;
[Trait("Category", "Unit")]

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

    [Fact]
    public async Task ListSubscriptionResourcesAsync_logs_when_arm_row_missing_id_or_type()
    {
        Mock<ILogger<GetOnlyHostedAzureArmReadClient>> logger = new();
        logger.Setup(l => l.IsEnabled(LogLevel.Warning)).Returns(true);

        HttpMessageHandler handler = new RecordingHandler(
            (_, _) => Task.FromResult(
                new HttpResponseMessage(HttpStatusCode.OK)
                {
                    Content = new StringContent("""
                                                {
                                                  "value": [
                                                    {
                                                      "name": "orphan",
                                                      "location": "eastus"
                                                    }
                                                  ]
                                                }
                                                """)
                }));

        HttpClient httpClient = new(handler);
        GetOnlyHostedAzureArmReadClient client = new(httpClient, logger.Object);

        IReadOnlyList<HostedAzureArmResourceRecord> resources = await client.ListSubscriptionResourcesAsync(
            "token-abc",
            "11111111-1111-1111-1111-111111111111",
            CancellationToken.None);

        Assert.Empty(resources);

        logger.Verify(
            static l => l.Log(
                LogLevel.Warning,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, _) => v.ToString()!.Contains("missing id or type", StringComparison.Ordinal)),
                It.IsAny<Exception>(),
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);
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
