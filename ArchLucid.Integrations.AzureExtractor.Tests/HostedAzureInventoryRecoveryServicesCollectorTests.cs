using System.Net;
using System.Text;

using ArchLucid.Core.AzureExtractor;
using ArchLucid.Integrations.AzureExtractor;

using Microsoft.Extensions.Logging.Abstractions;

using Moq;
using Moq.Protected;

using Xunit;

namespace ArchLucid.Integrations.AzureExtractor.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Integrations.AzureExtractor")]
public sealed class HostedAzureInventoryRecoveryServicesCollectorTests
{
    private const string VaultId =
        "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.RecoveryServices/vaults/backup-vault";
    private const string VmId =
        "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/app-vm";

    [Fact]
    public async Task CollectAsync_maps_backup_item_and_continues_after_site_recovery_403()
    {
        Mock<HttpMessageHandler> handler = new();
        handler
            .Protected()
            .Setup<Task<HttpResponseMessage>>(
                "SendAsync",
                ItExpr.IsAny<HttpRequestMessage>(),
                ItExpr.IsAny<CancellationToken>())
            .ReturnsAsync((HttpRequestMessage request, CancellationToken _) =>
            {
                string uri = request.RequestUri!.ToString();

                if (uri.Contains("backupProtectedItems", StringComparison.OrdinalIgnoreCase))
                {
                    string body = $$"""
                                    {
                                      "value": [
                                        {
                                          "properties": {
                                            "sourceResourceId": "{{VmId}}"
                                          }
                                        }
                                      ]
                                    }
                                    """;

                    return new HttpResponseMessage(HttpStatusCode.OK)
                    {
                        Content = new StringContent(body, Encoding.UTF8, "application/json"),
                    };
                }

                if (uri.Contains("replicationProtectedItems", StringComparison.OrdinalIgnoreCase))
                {
                    return new HttpResponseMessage(HttpStatusCode.Forbidden);
                }

                return new HttpResponseMessage(HttpStatusCode.NotFound);
            });

        HttpClient httpClient = new(handler.Object);
        GetOnlyHostedAzureArmReadClient armReadClient = new(
            httpClient,
            NullLogger<GetOnlyHostedAzureArmReadClient>.Instance);

        IReadOnlyList<HostedAzureArmResourceRecord> resources =
        [
            new HostedAzureArmResourceRecord(
                AzureInventoryRecoveryServices.VaultResourceType,
                VaultId,
                "backup-vault",
                "eastus",
                null,
                null,
                new Dictionary<string, object?>()),
        ];

        IReadOnlyList<AzureInventoryRecoveryServicesProtectedItemRow> rows =
            await HostedAzureInventoryRecoveryServicesCollector.CollectAsync(
                armReadClient,
                "token",
                resources,
                NullLogger.Instance,
                CancellationToken.None);

        Assert.Contains(
            rows,
            row => row.ItemKind == AzureInventoryRecoveryServices.BackupItemKind
                && row.SourceResourceId.Equals(VmId, StringComparison.OrdinalIgnoreCase)
                && row.CollectionStatus == AzureInventoryAdfLinkedServiceCollectionStatus.Succeeded);
        Assert.Contains(
            rows,
            row => row.WarningCode != null
                && row.WarningCode.StartsWith(
                    AzureInventoryRecoveryServicesCompletenessWarningCodes.SiteRecoveryListFailedPrefix,
                    StringComparison.Ordinal));
    }
}
