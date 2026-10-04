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

    [Fact]
    public void Extract_prefers_top_level_folder_path_over_location_file_name()
    {
        JsonElement properties = Parse("""
            {
              "type": "AzureBlob",
              "typeProperties": {
                "folderPath": "raw/ingest",
                "location": {
                  "fileName": "data.csv"
                }
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
        containerOrFilesystem.Should().BeNull();
        tableName.Should().BeNull();
        schemaName.Should().BeNull();
    }

    [Fact]
    public void Extract_prefers_container_over_file_name_for_blob_location()
    {
        JsonElement properties = Parse("""
            {
              "type": "AzureBlob",
              "typeProperties": {
                "location": {
                  "container": "raw",
                  "fileName": "data.csv"
                }
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
        containerOrFilesystem.Should().Be("raw");
        folderPath.Should().Be("data.csv");
        tableName.Should().BeNull();
        schemaName.Should().BeNull();
    }

    private static JsonElement Parse(string json)
    {
        using JsonDocument document = JsonDocument.Parse(json);

        return document.RootElement.Clone();
    }
}
