using System.Text.Json;

using ArchLucid.Core.AzureExtractor;

using FluentAssertions;

namespace ArchLucid.Core.Tests.AzureExtractor;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class AzureInventoryAppSettingHostParserTests
{
    [Fact]
    public void TryParse_rejects_companion_rows_containing_password_marker()
    {
        string json = """
                      {
                        "siteResourceId": "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Web/sites/app1",
                        "settingName": "SqlConnection",
                        "host": "Password=leak",
                        "collectionStatus": "Succeeded"
                      }
                      """;

        using JsonDocument document = JsonDocument.Parse(json);

        bool parsed = AzureInventoryAppSettingHostParser.TryParse(
            document.RootElement,
            out AzureInventoryAppSettingHostRow? row,
            out string? errorMessage);

        parsed.Should().BeFalse();
        row.Should().BeNull();
        errorMessage.Should().Contain("rejected");
    }

    [Fact]
    public void TryParse_accepts_redacted_sql_host_row()
    {
        string json = """
                      {
                        "siteResourceId": "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Web/sites/app1",
                        "settingName": "SqlConnection",
                        "host": "prodsql.database.windows.net",
                        "collectionStatus": "Succeeded"
                      }
                      """;

        using JsonDocument document = JsonDocument.Parse(json);

        bool parsed = AzureInventoryAppSettingHostParser.TryParse(
            document.RootElement,
            out AzureInventoryAppSettingHostRow? row,
            out string? _);

        parsed.Should().BeTrue();
        row!.Host.Should().Be("prodsql.database.windows.net");
    }
}
