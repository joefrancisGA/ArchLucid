using System.Text.Json;

using ArchLucid.Core.AzureExtractor;

using FluentAssertions;

namespace ArchLucid.Core.Tests.AzureExtractor;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class AzureInventoryAdfDatasetLocationExtractorTests
{
    [Fact]
    public void Extract_reads_blob_folder_path_without_connection_string()
    {
        JsonElement properties = Parse("""
            {
              "type": "AzureBlob",
              "typeProperties": {
                "connectionString": { "type": "SecureString", "value": "secret" },
                "folderPath": "raw/ingest",
                "fileName": "data.csv"
              }
            }
            """);

        (
            string? locationKind,
            string? containerOrFilesystem,
            string? folderPath,
            string? tableName,
            string? schemaName) = AzureInventoryAdfDatasetLocationExtractor.Extract(properties);

        locationKind.Should().Be("AzureBlob");
        folderPath.Should().Be("raw/ingest");
        tableName.Should().BeNull();
        schemaName.Should().BeNull();
    }

    private static JsonElement Parse(string json)
    {
        using JsonDocument document = JsonDocument.Parse(json);

        return document.RootElement.Clone();
    }
}
