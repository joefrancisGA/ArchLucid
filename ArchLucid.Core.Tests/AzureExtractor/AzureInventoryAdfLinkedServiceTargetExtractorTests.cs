using System.Text.Json;

using ArchLucid.Core.AzureExtractor;

using FluentAssertions;

namespace ArchLucid.Core.Tests.AzureExtractor;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class AzureInventoryAdfLinkedServiceTargetExtractorTests
{
    [Fact]
    public void Extract_reads_sql_host_from_percent_encoded_connection_string_server_segment()
    {
        string host = "sql1.database.windows.net";
        string encodedHost = Uri.EscapeDataString(host);
        string connectionString = $"Server=tcp:{encodedHost},1433;Database=app;User Id=x;Password=secret";

        using JsonDocument document = JsonDocument.Parse(
            $$"""{ "connectionString": {{JsonSerializer.Serialize(connectionString)}} }""");

        (string? targetResourceId, string? targetHost) =
            AzureInventoryAdfLinkedServiceTargetExtractor.Extract(document.RootElement, "AzureMySql");

        targetResourceId.Should().BeNull();
        targetHost.Should().Be(host);
    }
}
