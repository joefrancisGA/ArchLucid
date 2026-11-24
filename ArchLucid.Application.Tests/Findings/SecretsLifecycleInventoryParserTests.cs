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
        "arn:aws:secretsmanager:us-east-1:111122223333:secret:prod-aaaaaa-Aa0000",
        "prod-aaaaaa")]
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

    [Theory]
    [InlineData(long.MinValue, true)]
    [InlineData(long.MinValue, false)]
    [InlineData(long.MaxValue, true)]
    [InlineData(long.MaxValue, false)]
    public void ParseFromResourcesJson_ignores_out_of_range_unix_expiry_and_continues(
        long unixSeconds,
        bool asString)
    {
        object invalidTimestamp = asString
            ? unixSeconds.ToString(System.Globalization.CultureInfo.InvariantCulture)
            : unixSeconds;

        string json = System.Text.Json.JsonSerializer.Serialize(new[]
        {
            new
            {
                resourceType = "Microsoft.KeyVault/vaults/secrets",
                resourceId = "/subscriptions/s/resourceGroups/r/providers/Microsoft.KeyVault/vaults/kv/secrets/secret-a",
                name = "secret-a",
                properties = new
                {
                    attributes = new { updated = "2026-01-01T00:00:00Z", exp = invalidTimestamp },
                    expiresOn = "2027-01-01T00:00:00Z",
                },
            },
            new
            {
                resourceType = "Microsoft.KeyVault/vaults/secrets",
                resourceId = "/subscriptions/s/resourceGroups/r/providers/Microsoft.KeyVault/vaults/kv/secrets/secret-b",
                name = "secret-b",
                properties = new
                {
                    attributes = new { updated = "2026-01-01T00:00:00Z", exp = (object)1_700_000_000L },
                    expiresOn = "2027-01-01T00:00:00Z",
                },
            },
        });

        IReadOnlyList<SecretsLifecycleInventoryRow> rows =
            SecretsLifecycleInventoryParser.ParseFromResourcesJson(json, "Azure");

        rows.Should().HaveCount(2);
        rows[0].SecretName.Should().Be("secret-a");
        rows[0].ExpiryUtc.Should().Be(new DateTimeOffset(2027, 1, 1, 0, 0, 0, TimeSpan.Zero));
        rows[1].SecretName.Should().Be("secret-b");
        rows[1].ExpiryUtc.Should().Be(DateTimeOffset.FromUnixTimeSeconds(1_700_000_000));
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
