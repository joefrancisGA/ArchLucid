using System.Text.Json;

using ArchLucid.Core.AzureExtractor;

using FluentAssertions;

namespace ArchLucid.Core.Tests.AzureExtractor;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class AzureInventoryAdfLinkedServiceTargetExtractorTests
{
    [Fact]
    public void Extract_reads_table_storage_host_from_percent_encoded_table_endpoint_url()
    {
        const string host = "sa1.table.core.windows.net";
        string encodedEndpoint = Uri.EscapeDataString($"https://{host}/");

        using JsonDocument document = JsonDocument.Parse(
            $$"""{ "tableEndpoint": "{{encodedEndpoint}}" }""");

        (string? targetResourceId, string? targetHost) =
            AzureInventoryAdfLinkedServiceTargetExtractor.Extract(document.RootElement, "AzureTableStorage");

        targetResourceId.Should().BeNull();
        targetHost.Should().Be(host);
    }

    [Fact]
    public void Extract_reads_cosmos_host_from_percent_encoded_account_endpoint_url()
    {
        const string host = "acct.documents.azure.com";
        string encodedEndpoint = Uri.EscapeDataString($"https://{host}:443/");

        using JsonDocument document = JsonDocument.Parse(
            $$"""{ "accountEndpoint": "{{encodedEndpoint}}" }""");

        (string? targetResourceId, string? targetHost) =
            AzureInventoryAdfLinkedServiceTargetExtractor.Extract(document.RootElement, "AzureCosmosDb");

        targetResourceId.Should().BeNull();
        targetHost.Should().Be(host);
    }

    [Fact]
    public void Extract_reads_blob_host_from_account_uri_when_service_endpoint_is_localhost()
    {
        const string host = "sa2.blob.core.windows.net";
        string encodedAccountUri = Uri.EscapeDataString($"https://{host}/");

        using JsonDocument document = JsonDocument.Parse(
            $$"""
              {
                "serviceEndpoint": "https://localhost:10000/devstoreaccount1",
                "accountUri": "{{encodedAccountUri}}"
              }
              """);

        (string? targetResourceId, string? targetHost) =
            AzureInventoryAdfLinkedServiceTargetExtractor.Extract(document.RootElement, "AzureBlobStorage");

        targetResourceId.Should().BeNull();
        targetHost.Should().Be(host);
    }

    [Fact]
    public void Extract_reads_blob_host_from_account_uri_when_service_endpoint_yields_non_hostname()
    {
        const string host = "sa2.blob.core.windows.net";
        string invalidEndpoint = Uri.EscapeDataString("not-a-valid-hostname");
        string encodedAccountUri = Uri.EscapeDataString($"https://{host}/");

        using JsonDocument document = JsonDocument.Parse(
            $$"""
              {
                "serviceEndpoint": "{{invalidEndpoint}}",
                "accountUri": "{{encodedAccountUri}}"
              }
              """);

        (string? targetResourceId, string? targetHost) =
            AzureInventoryAdfLinkedServiceTargetExtractor.Extract(document.RootElement, "AzureBlobStorage");

        targetResourceId.Should().BeNull();
        targetHost.Should().Be(host);
    }

    [Fact]
    public void Extract_reads_blob_host_from_percent_encoded_account_uri_url()
    {
        const string host = "sa1.blob.core.windows.net";
        string encodedUrl = Uri.EscapeDataString($"https://{host}/");

        using JsonDocument document = JsonDocument.Parse(
            $$"""{ "accountUri": "{{encodedUrl}}" }""");

        (string? targetResourceId, string? targetHost) =
            AzureInventoryAdfLinkedServiceTargetExtractor.Extract(document.RootElement, "AzureBlobStorage");

        targetResourceId.Should().BeNull();
        targetHost.Should().Be(host);
    }

    [Fact]
    public void Extract_reads_blob_fs_host_from_percent_encoded_url_property()
    {
        const string host = "sa1.dfs.core.windows.net";
        string encodedUrl = Uri.EscapeDataString($"https://{host}/filesystem");

        using JsonDocument document = JsonDocument.Parse(
            $$"""{ "url": "{{encodedUrl}}" }""");

        (string? targetResourceId, string? targetHost) =
            AzureInventoryAdfLinkedServiceTargetExtractor.Extract(document.RootElement, "AzureBlobFS");

        targetResourceId.Should().BeNull();
        targetHost.Should().Be(host);
    }

    [Fact]
    public void Extract_reads_blob_host_from_percent_encoded_service_endpoint_url()
    {
        const string host = "sa1.blob.core.windows.net";
        string encodedUrl = Uri.EscapeDataString($"https://{host}/");

        using JsonDocument document = JsonDocument.Parse(
            $$"""{ "serviceEndpoint": "{{encodedUrl}}" }""");

        (string? targetResourceId, string? targetHost) =
            AzureInventoryAdfLinkedServiceTargetExtractor.Extract(document.RootElement, "AzureBlobStorage");

        targetResourceId.Should().BeNull();
        targetHost.Should().Be(host);
    }

    [Fact]
    public void Extract_reads_sql_host_from_percent_encoded_server_property()
    {
        string host = "sql1.database.windows.net";
        string encodedHost = Uri.EscapeDataString(host);

        using JsonDocument document = JsonDocument.Parse(
            $$"""{ "server": "{{encodedHost}}" }""");

        (string? targetResourceId, string? targetHost) =
            AzureInventoryAdfLinkedServiceTargetExtractor.Extract(document.RootElement, "AzureSqlDatabase");

        targetResourceId.Should().BeNull();
        targetHost.Should().Be(host);
    }

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
