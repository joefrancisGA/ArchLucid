using ArchLucid.Application.Findings;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Findings;

[Trait("Category", "Unit")]
public sealed class SecretsLifecycleInventoryParserTests
{
    [Fact]
    public void ParseFromResourcesJson_parses_azure_secret_row()
    {
        const string resourcesJson =
            """
            [
              {
                "resourceType": "Microsoft.KeyVault/vaults/secrets",
                "resourceId": "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.KeyVault/vaults/pay-kv/secrets/db-password",
                "name": "db-password",
                "properties": {
                  "attributes": {
                    "updated": "2026-01-01T00:00:00Z",
                    "exp": "2026-09-20T00:00:00Z"
                  }
                }
              }
            ]
            """;

        IReadOnlyList<SecretsLifecycleInventoryRow> rows =
            SecretsLifecycleInventoryParser.ParseFromResourcesJson(resourcesJson, "Azure");

        SecretsLifecycleInventoryRow row = rows.Should().ContainSingle().Subject;
        row.SecretName.Should().Be("db-password");
        row.VaultName.Should().Be("pay-kv");
        row.LastRotatedUtc.Should().NotBeNull();
        row.ExpiryUtc.Should().NotBeNull();
    }
}
