using System.Text.Json;

using ArchLucid.Core.AzureExtractor;

using FluentAssertions;

namespace ArchLucid.Core.Tests.AzureExtractor;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class AzureInventorySqlDatabasePrincipalParserTests
{
    [Fact]
    public void TryParse_rejects_rows_containing_table_name_field()
    {
        string json = """
                      {
                        "databaseArmId": "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Sql/servers/sql1/databases/appdb",
                        "principalName": "archlucid-api",
                        "typeDesc": "EXTERNAL_USER",
                        "collectionStatus": "Succeeded",
                        "table_name": "Users"
                      }
                      """;

        using JsonDocument document = JsonDocument.Parse(json);

        bool parsed = AzureInventorySqlDatabasePrincipalParser.TryParse(
            document.RootElement,
            out AzureInventorySqlDatabasePrincipalRow? row,
            out string? errorMessage);

        parsed.Should().BeFalse();
        row.Should().BeNull();
        errorMessage.Should().Contain("table_name");
    }

    [Fact]
    public void TryParse_accepts_external_user_principal_row()
    {
        string json = """
                      {
                        "databaseArmId": "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Sql/servers/sql1/databases/appdb",
                        "principalName": "archlucid-api",
                        "typeDesc": "EXTERNAL_USER",
                        "collectionStatus": "Succeeded"
                      }
                      """;

        using JsonDocument document = JsonDocument.Parse(json);

        bool parsed = AzureInventorySqlDatabasePrincipalParser.TryParse(
            document.RootElement,
            out AzureInventorySqlDatabasePrincipalRow? row,
            out string? _);

        parsed.Should().BeTrue();
        row!.PrincipalName.Should().Be("archlucid-api");
        row.TypeDesc.Should().Be("EXTERNAL_USER");
    }
}
