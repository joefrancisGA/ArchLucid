using System.Text.Json;

using ArchLucid.Core.AzureExtractor;

using FluentAssertions;

namespace ArchLucid.Core.Tests.AzureExtractor;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class AzureInventoryAppSettingHostDiscardTests
{
    private const string SecretPayload = "s3cret-value";

    [Theory]
    [InlineData("Server=tcp:prodsql.database.windows.net,1433;Initial Catalog=db;Password=s3cret-value")]
    [InlineData("DefaultEndpointsProtocol=https;AccountName=starch;AccountKey=s3cret-value;EndpointSuffix=core.windows.net")]
    [InlineData("Endpoint=sb://orders.servicebus.windows.net/;SharedAccessKey=s3cret-value")]
    public void ParseSettingValues_serializes_without_secret_payload(string connectionString)
    {
        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(connectionString);

        parsed.Should().NotBeEmpty();

        string json = JsonSerializer.Serialize(parsed);

        json.Should().NotContain(SecretPayload);
        parsed.Should().OnlyContain(field => !string.IsNullOrWhiteSpace(field.Host) || !string.IsNullOrWhiteSpace(field.Catalog));
    }

    [Fact]
    public void App_setting_host_row_has_no_value_property()
    {
        typeof(AzureInventoryAppSettingHostRow)
            .GetProperties()
            .Select(property => property.Name)
            .Should()
            .NotContain(name => name.Contains("Value", StringComparison.OrdinalIgnoreCase)
                                || name.Contains("Password", StringComparison.OrdinalIgnoreCase)
                                || name.Contains("ConnectionString", StringComparison.OrdinalIgnoreCase));
    }
}
