using System.Net;
using System.Text;

using Microsoft.Extensions.Logging.Abstractions;

using Xunit;

namespace ArchLucid.Integrations.AzureExtractor.Tests;
[Trait("Category", "Unit")]

public sealed class HostedAzureManagementPostReadClientTests
{
    [Fact]
    public async Task QueryPolicyComplianceAsync_rejects_next_link_for_different_subscription_id()
    {
        const string subscriptionId = "11111111-1111-1111-1111-111111111111";
        const string otherSubscriptionId = "22222222-2222-2222-2222-222222222222";
        const string crossSubscriptionNextLink =
            $"https://management.azure.com/subscriptions/{otherSubscriptionId}/providers/Microsoft.PolicyInsights/policyStates/latest/queryResults?api-version=2019-10-01&$skiptoken=leak";

        string firstPageBody = """
                               {
                                 "value": [
                                   {
                                     "policyAssignmentId": "/subscriptions/11111111-1111-1111-1111-111111111111/providers/Microsoft.Authorization/policyAssignments/pa1",
                                     "complianceState": "Compliant"
                                   }
                                 ],
                                 "@odata.nextLink": "CROSS_SUBSCRIPTION_LINK"
                               }
                               """.Replace("CROSS_SUBSCRIPTION_LINK", crossSubscriptionNextLink, StringComparison.Ordinal);

        string secondPageBody = """
                                {
                                  "value": [
                                    {
                                      "policyAssignmentId": "/subscriptions/22222222-2222-2222-2222-222222222222/providers/Microsoft.Authorization/policyAssignments/pa2",
                                      "complianceState": "NonCompliant"
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
                    Assert.Equal(HttpMethod.Post, request.Method);

                    return Task.FromResult(
                        new HttpResponseMessage(HttpStatusCode.OK)
                        {
                            Content = new StringContent(firstPageBody, Encoding.UTF8, "application/json")
                        });
                }

                if (current == 2)
                {
                    Assert.Equal(crossSubscriptionNextLink, request.RequestUri?.AbsoluteUri);

                    return Task.FromResult(
                        new HttpResponseMessage(HttpStatusCode.OK)
                        {
                            Content = new StringContent(secondPageBody, Encoding.UTF8, "application/json")
                        });
                }

                throw new InvalidOperationException(
                    "Test hang guard: policy compliance query did not stop on cross-subscription nextLink.");
            });

        HttpClient httpClient = new(handler);
        HostedAzureManagementPostReadClient client = new(httpClient, NullLogger<HostedAzureManagementPostReadClient>.Instance);

        HostedAzurePolicyComplianceDocument document = await client.QueryPolicyComplianceAsync(
            "token-abc",
            subscriptionId,
            "subscription",
            "2026-09-26T00:00:00Z",
            CancellationToken.None);

        Assert.Equal(1, requestCount);
        Assert.Single(document.Records);
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
