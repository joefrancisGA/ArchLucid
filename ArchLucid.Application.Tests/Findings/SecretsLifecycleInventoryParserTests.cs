using ArchLucid.Application.Findings;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Findings;

[Trait("Category", "Unit")]
public sealed class SecretsLifecycleInventoryParserTests
{
    [Theory]
    [InlineData(
        "arn:aws:secretsmanager:us-east-1:111122223333:secret:prod-payment-key-AbC123",
        "prod-payment-key")]
    [InlineData(
        "arn:aws:secretsmanager:us-east-1:111122223333:secret:prod-abcdef-ZyX987",
        "prod-abcdef")]
    [InlineData(
        "arn:aws:secretsmanager:us-east-1:111122223333:secret:prod-payment-key",
        "prod-payment-key")]
    [InlineData(
        "arn:aws:secretsmanager:us-east-1:111122223333:secret:prod-key-!!!!!!!",
        "prod-key-!!!!!!!")]
    public void ParseFromResourcesJson_preserves_hyphenated_aws_secret_names(
        string resourceArn, string expectedName)
    {
        string json = System.Text.Json.JsonSerializer.Serialize(new[]
        {
            new
            {
                resourceType = "AWS::SecretsManager::Secret",
                resourceId = resourceArn,
                properties = new { LastChangedDate = "2026-11-01T00:00:00Z" },
            },
        });

        SecretsLifecycleInventoryRow row =
            SecretsLifecycleInventoryParser.ParseFromResourcesJson(json, "Aws")
                .Should().ContainSingle().Subject;

        row.SecretName.Should().Be(expectedName);
        row.VaultName.Should().Be(expectedName);
        row.InventoryResourceId.Should().Be(resourceArn);
    }

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
