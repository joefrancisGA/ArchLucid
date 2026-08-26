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
    public async Task ListSubscriptionResourcesAsync_throws_when_next_link_repeats()
    {
        const string repeatingNextLink =
            "https://management.azure.com/subscriptions/11111111-1111-1111-1111-111111111111/resources?api-version=2021-04-01&$skiptoken=repeat";

        string body = """
                      {
                        "value": [
                          {
                            "id": "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/sa1",
                            "name": "sa1",
                            "type": "Microsoft.Storage/storageAccounts",
                            "location": "eastus"
                          }
                        ],
                        "nextLink": "REPEATING_LINK"
                      }
                      """.Replace("REPEATING_LINK", repeatingNextLink, StringComparison.Ordinal);

        int requestCount = 0;

        HttpMessageHandler handler = new RecordingHandler(
            (_, _) =>
            {
                int current = Interlocked.Increment(ref requestCount);

                if (current > 3)
                {
                    throw new InvalidOperationException(
                        "Test hang guard: ARM resource listing did not stop on repeating nextLink.");
                }

                return Task.FromResult(
                    new HttpResponseMessage(HttpStatusCode.OK)
                    {
                        Content = new StringContent(body)
                    });
            });

        HttpClient httpClient = new(handler);
        GetOnlyHostedAzureArmReadClient client = new(httpClient, NullLogger<GetOnlyHostedAzureArmReadClient>.Instance);

        InvalidOperationException exception = await Assert.ThrowsAsync<InvalidOperationException>(() =>
            client.ListSubscriptionResourcesAsync(
                "token-abc",
                "11111111-1111-1111-1111-111111111111",
                CancellationToken.None));

        Assert.Contains("repeating nextLink", exception.Message, StringComparison.OrdinalIgnoreCase);
        Assert.Equal(2, requestCount);
    }

    [Fact]
    public async Task ListSubscriptionResourcesAsync_preserves_null_arm_tag_values_as_empty_strings()
    {
        HttpMessageHandler handler = new RecordingHandler(
            (_, _) => Task.FromResult(
                new HttpResponseMessage(HttpStatusCode.OK)
                {
                    Content = new StringContent("""
                                                {
                                                  "value": [
                                                    {
                                                      "id": "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/sa1",
                                                      "name": "sa1",
                                                      "type": "Microsoft.Storage/storageAccounts",
                                                      "location": "eastus",
                                                      "tags": {
                                                        "env": "prod",
                                                        "owner": null
                                                      }
                                                    }
                                                  ]
                                                }
                                                """)
                }));

        HttpClient httpClient = new(handler);
        GetOnlyHostedAzureArmReadClient client = new(httpClient, NullLogger<GetOnlyHostedAzureArmReadClient>.Instance);

        IReadOnlyList<HostedAzureArmResourceRecord> resources = await client.ListSubscriptionResourcesAsync(
            "token-abc",
            "11111111-1111-1111-1111-111111111111",
            CancellationToken.None);

        Assert.Single(resources);
        Assert.NotNull(resources[0].Tags);
        Assert.Equal("prod", resources[0].Tags!["env"]);
        Assert.Equal(string.Empty, resources[0].Tags!["owner"]);
    }

    [Fact]
    public async Task ListSubscriptionResourcesAsync_throws_when_next_link_targets_different_subscription()
    {
        const string requestedSubscriptionId = "11111111-1111-1111-1111-111111111111";
        const string otherSubscriptionId = "22222222-2222-2222-2222-222222222222";
        const string crossSubscriptionNextLink =
            $"https://management.azure.com/subscriptions/{otherSubscriptionId}/resources?api-version=2021-04-01&$skiptoken=leak";

        string firstPageBody = """
                               {
                                 "value": [
                                   {
                                     "id": "/subscriptions/11111111-1111-1111-1111-111111111111/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/sa1",
                                     "name": "sa1",
                                     "type": "Microsoft.Storage/storageAccounts",
                                     "location": "eastus"
                                   }
                                 ],
                                 "nextLink": "CROSS_SUBSCRIPTION_LINK"
                               }
                               """.Replace("CROSS_SUBSCRIPTION_LINK", crossSubscriptionNextLink, StringComparison.Ordinal);

        string secondPageBody = """
                                {
                                  "value": [
                                    {
                                      "id": "/subscriptions/22222222-2222-2222-2222-222222222222/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/sa2",
                                      "name": "sa2",
                                      "type": "Microsoft.Storage/storageAccounts",
                                      "location": "westus"
                                    }
                                  ]
                                }
                                """;

        int requestCount = 0;

        HttpMessageHandler handler = new RecordingHandler(
            (request, _) =>
            {
                int current = Interlocked.Increment(ref requestCount);

                if (current == 1)
                {
                    return Task.FromResult(
                        new HttpResponseMessage(HttpStatusCode.OK)
                        {
                            Content = new StringContent(firstPageBody)
                        });
                }

                if (current == 2)
                {
                    Assert.Equal(crossSubscriptionNextLink, request.RequestUri?.AbsoluteUri);

                    return Task.FromResult(
                        new HttpResponseMessage(HttpStatusCode.OK)
                        {
                            Content = new StringContent(secondPageBody)
                        });
                }

                throw new InvalidOperationException(
                    "Test hang guard: ARM resource listing did not stop on cross-subscription nextLink.");
            });

        HttpClient httpClient = new(handler);
        GetOnlyHostedAzureArmReadClient client = new(httpClient, NullLogger<GetOnlyHostedAzureArmReadClient>.Instance);

        InvalidOperationException exception = await Assert.ThrowsAsync<InvalidOperationException>(() =>
            client.ListSubscriptionResourcesAsync(
                "token-abc",
                requestedSubscriptionId,
                CancellationToken.None));

        Assert.Contains("subscription", exception.Message, StringComparison.OrdinalIgnoreCase);
        Assert.Equal(1, requestCount);
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
