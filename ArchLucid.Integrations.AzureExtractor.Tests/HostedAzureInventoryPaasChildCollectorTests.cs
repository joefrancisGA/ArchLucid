using System.Net;
using System.Text.Json;

using ArchLucid.Core.AzureExtractor;

using Microsoft.Extensions.Logging.Abstractions;

using Xunit;

namespace ArchLucid.Integrations.AzureExtractor.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Integrations.AzureExtractor")]
public sealed class HostedAzureInventoryPaasChildCollectorTests
{
    private const string SqlServerId =
        "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Sql/servers/sql1";

    [Fact]
    public async Task CollectAsync_warns_when_sql_database_list_is_partially_collected()
    {
        const string nextLink =
            $"https://management.azure.com{SqlServerId}/databases?api-version=2021-11-01&$skiptoken=page2";

        string firstPageBody = """
                               {
                                 "value": [
                                   {
                                     "id": "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Sql/servers/sql1/databases/db1",
                                     "name": "db1"
                                   }
                                 ],
                                 "nextLink": "SQL_DB_NEXT_LINK"
                               }
                               """.Replace("SQL_DB_NEXT_LINK", nextLink, StringComparison.Ordinal);

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

        HostedAzureArmResourceRecord sqlServer = new(
            "Microsoft.Sql/servers",
            SqlServerId,
            "sql1",
            "eastus",
            null,
            null,
            new Dictionary<string, object?>());

        HostedAzureInventoryPaasChildCollectResult result =
            await HostedAzureInventoryPaasChildCollector.CollectAsync(
                armReadClient,
                "token-abc",
                [sqlServer],
                NullLogger.Instance,
                CancellationToken.None);

        Assert.Equal(3, requestCount);
        Assert.Single(result.Associations);
        Assert.Equal(
            AzureInventoryPaasChildCompletenessWarningCodes.PartialChildEnumeration,
            Assert.Single(result.CollectionWarnings));
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
