using System.Text.Json;

using ArchLucid.Core.AzureExtractor;

using FluentAssertions;

namespace ArchLucid.Core.Tests.AzureExtractor;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class AzureInventoryAdfLinkedServiceTargetExtractorTests
{
    [Fact]
    public void Extract_reads_sql_host_from_percent_encoded_server_property_with_encoded_trailing_dot()
    {
        const string host = "sql1.database.windows.net";
        string encodedServer = Uri.EscapeDataString(host + ".%2E");

        using JsonDocument document = JsonDocument.Parse(
            $$"""{ "server": "{{encodedServer}}" }""");

        (string? targetResourceId, string? targetHost) =
            AzureInventoryAdfLinkedServiceTargetExtractor.Extract(document.RootElement, "AzureSqlDatabase");

        targetResourceId.Should().BeNull();
        targetHost.Should().Be(host);
    }

    [Fact]
    public void Extract_reads_sql_host_from_server_property_with_trailing_dot()
    {
        using JsonDocument document = JsonDocument.Parse(
            """{ "server": "sql1.database.windows.net." }""");

        (string? targetResourceId, string? targetHost) =
            AzureInventoryAdfLinkedServiceTargetExtractor.Extract(document.RootElement, "AzureSqlDatabase");

        targetResourceId.Should().BeNull();
        targetHost.Should().Be("sql1.database.windows.net");
    }

    [Fact]
    public void Extract_reads_sql_host_from_percent_encoded_server_property_with_trailing_dot()
    {
        const string host = "sql1.database.windows.net";
        string encodedServer = Uri.EscapeDataString(host + ".");

        using JsonDocument document = JsonDocument.Parse(
            $$"""{ "server": "{{encodedServer}}" }""");

        (string? targetResourceId, string? targetHost) =
            AzureInventoryAdfLinkedServiceTargetExtractor.Extract(document.RootElement, "AzureSqlDatabase");

        targetResourceId.Should().BeNull();
        targetHost.Should().Be(host);
    }

    [Fact]
    public void Extract_reads_synapse_host_from_percent_encoded_server_when_connection_string_is_whitespace_only()
    {
        const string host = "mysynapse.sql.azuresynapse.net";
        string encodedHost = Uri.EscapeDataString(host + ".%2E");

        using JsonDocument document = JsonDocument.Parse(
            $$"""{ "server": {{JsonSerializer.Serialize(encodedHost)}}, "connectionString": "   " }""");

        (string? targetResourceId, string? targetHost) =
            AzureInventoryAdfLinkedServiceTargetExtractor.Extract(document.RootElement, "AzureSynapseAnalytics");

        targetResourceId.Should().BeNull();
        targetHost.Should().Be(host);
    }

    [Fact]
    public void Extract_reads_synapse_host_from_percent_encoded_endpoint_host_only_with_encoded_trailing_dot()
    {
        const string host = "mysynapse.sql.azuresynapse.net";
        string encodedHost = Uri.EscapeDataString(host + ".%2E");

        using JsonDocument document = JsonDocument.Parse(
            $$"""{ "endpoint": {{JsonSerializer.Serialize(encodedHost)}} }""");

        (string? targetResourceId, string? targetHost) =
            AzureInventoryAdfLinkedServiceTargetExtractor.Extract(document.RootElement, "AzureSynapseAnalytics");

        targetResourceId.Should().BeNull();
        targetHost.Should().Be(host);
    }

    [Fact]
    public void Extract_reads_synapse_host_from_percent_encoded_endpoint_url()
    {
        const string host = "mysynapse.sql.azuresynapse.net";
        string encodedEndpoint = Uri.EscapeDataString($"https://{host}/");

        using JsonDocument document = JsonDocument.Parse(
            $$"""{ "endpoint": "{{encodedEndpoint}}" }""");

        (string? targetResourceId, string? targetHost) =
            AzureInventoryAdfLinkedServiceTargetExtractor.Extract(document.RootElement, "AzureSynapseAnalytics");

        targetResourceId.Should().BeNull();
        targetHost.Should().Be(host);
    }

    [Fact]
    public void Extract_reads_cosmos_host_from_percent_encoded_account_endpoint_when_domain_is_whitespace_only()
    {
        const string host = "cosmosacct.documents.azure.com";
        string encodedEndpoint = Uri.EscapeDataString($"https://{host}.");

        using JsonDocument document = JsonDocument.Parse(
            $$"""{ "domain": "   ", "accountEndpoint": {{JsonSerializer.Serialize(encodedEndpoint)}} }""");

        (string? targetResourceId, string? targetHost) =
            AzureInventoryAdfLinkedServiceTargetExtractor.Extract(document.RootElement, "AzureCosmosDb");

        targetResourceId.Should().BeNull();
        targetHost.Should().Be(host);
    }

    [Fact]
    public void Extract_reads_table_storage_host_from_percent_encoded_table_endpoint_when_account_uri_is_whitespace_only()
    {
        const string host = "sa1.table.core.windows.net";
        string encodedEndpoint = Uri.EscapeDataString($"https://{host}.");

        using JsonDocument document = JsonDocument.Parse(
            $$"""{ "accountUri": "   ", "tableEndpoint": {{JsonSerializer.Serialize(encodedEndpoint)}} }""");

        (string? targetResourceId, string? targetHost) =
            AzureInventoryAdfLinkedServiceTargetExtractor.Extract(document.RootElement, "AzureTableStorage");

        targetResourceId.Should().BeNull();
        targetHost.Should().Be(host);
    }

    [Fact]
    public void Extract_reads_blob_host_from_percent_encoded_account_uri_when_service_endpoint_is_whitespace_only()
    {
        const string host = "sa2.blob.core.windows.net";
        string encodedAccountUri = Uri.EscapeDataString($"https://{host}.");

        using JsonDocument document = JsonDocument.Parse(
            $$"""{ "serviceEndpoint": "   ", "accountUri": {{JsonSerializer.Serialize(encodedAccountUri)}} }""");

        (string? targetResourceId, string? targetHost) =
            AzureInventoryAdfLinkedServiceTargetExtractor.Extract(document.RootElement, "AzureBlobStorage");

        targetResourceId.Should().BeNull();
        targetHost.Should().Be(host);
    }

    [Fact]
    public void Extract_reads_databricks_host_from_percent_encoded_workspace_url_when_domain_is_whitespace_only()
    {
        const string host = "adb-1234567890123456.7.azuredatabricks.net";
        string encodedUrl = Uri.EscapeDataString($"https://{host}.");

        using JsonDocument document = JsonDocument.Parse(
            $$"""{ "domain": "   ", "workspaceUrl": {{JsonSerializer.Serialize(encodedUrl)}} }""");

        (string? targetResourceId, string? targetHost) =
            AzureInventoryAdfLinkedServiceTargetExtractor.Extract(document.RootElement, "AzureDatabricks");

        targetResourceId.Should().BeNull();
        targetHost.Should().Be(host);
    }

    [Fact]
    public void Extract_reads_databricks_host_from_percent_encoded_workspace_url()
    {
        const string host = "adb-1234567890123456.7.azuredatabricks.net";
        string encodedUrl = Uri.EscapeDataString($"https://{host}/");

        using JsonDocument document = JsonDocument.Parse(
            $$"""{ "workspaceUrl": "{{encodedUrl}}" }""");

        (string? targetResourceId, string? targetHost) =
            AzureInventoryAdfLinkedServiceTargetExtractor.Extract(document.RootElement, "AzureDatabricks");

        targetResourceId.Should().BeNull();
        targetHost.Should().Be(host);
    }

    [Fact]
    public void Extract_reads_event_hub_host_from_percent_encoded_fully_qualified_namespace_with_trailing_dot()
    {
        const string host = "eh1.servicebus.windows.net";
        string encodedNamespace = Uri.EscapeDataString(host + ".");

        using JsonDocument document = JsonDocument.Parse(
            $$"""{ "fullyQualifiedNamespace": "{{encodedNamespace}}" }""");

        (string? targetResourceId, string? targetHost) =
            AzureInventoryAdfLinkedServiceTargetExtractor.Extract(document.RootElement, "AzureEventHub");

        targetResourceId.Should().BeNull();
        targetHost.Should().Be(host);
    }

    [Fact]
    public void Extract_reads_service_bus_host_from_percent_encoded_fully_qualified_namespace()
    {
        const string host = "eh1.servicebus.windows.net";
        string encodedNamespace = Uri.EscapeDataString(host);

        using JsonDocument document = JsonDocument.Parse(
            $$"""{ "fullyQualifiedNamespace": "{{encodedNamespace}}" }""");

        (string? targetResourceId, string? targetHost) =
            AzureInventoryAdfLinkedServiceTargetExtractor.Extract(document.RootElement, "AzureServiceBus");

        targetResourceId.Should().BeNull();
        targetHost.Should().Be(host);
    }

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
    public void Extract_reads_blob_fs_host_from_percent_encoded_url_when_account_name_is_whitespace_only()
    {
        const string host = "sa1.dfs.core.windows.net";
        string encodedUrl = Uri.EscapeDataString($"https://{host}.");

        using JsonDocument document = JsonDocument.Parse(
            $$"""{ "accountName": "   ", "url": {{JsonSerializer.Serialize(encodedUrl)}} }""");

        (string? targetResourceId, string? targetHost) =
            AzureInventoryAdfLinkedServiceTargetExtractor.Extract(document.RootElement, "AzureBlobFS");

        targetResourceId.Should().BeNull();
        targetHost.Should().Be(host);
    }

    [Fact]
    public void Extract_reads_key_vault_host_from_percent_encoded_base_url_when_vault_name_is_whitespace_only()
    {
        const string host = "kv1.vault.azure.net";
        string encodedBaseUrl = Uri.EscapeDataString($"https://{host}.");

        using JsonDocument document = JsonDocument.Parse(
            $$"""{ "vaultName": "   ", "baseUrl": {{JsonSerializer.Serialize(encodedBaseUrl)}} }""");

        (string? targetResourceId, string? targetHost) =
            AzureInventoryAdfLinkedServiceTargetExtractor.Extract(document.RootElement, "AzureKeyVault");

        targetResourceId.Should().BeNull();
        targetHost.Should().Be(host);
    }

    [Fact]
    public void Extract_reads_data_lake_store_host_from_percent_encoded_data_lake_store_uri_when_service_principal_id_is_whitespace_only()
    {
        const string host = "adlsgen1.azuredatalakestore.net";
        string encodedUri = Uri.EscapeDataString($"https://{host}.");

        using JsonDocument document = JsonDocument.Parse(
            $$"""{ "servicePrincipalId": "   ", "dataLakeStoreUri": {{JsonSerializer.Serialize(encodedUri)}} }""");

        (string? targetResourceId, string? targetHost) =
            AzureInventoryAdfLinkedServiceTargetExtractor.Extract(document.RootElement, "AzureDataLakeStore");

        targetResourceId.Should().BeNull();
        targetHost.Should().Be(host);
    }

    [Fact]
    public void Extract_reads_rest_service_host_from_percent_encoded_url_when_user_name_is_whitespace_only()
    {
        const string host = "api.contoso.com";
        string encodedUrl = Uri.EscapeDataString($"https://{host}.");

        using JsonDocument document = JsonDocument.Parse(
            $$"""{ "userName": "   ", "url": {{JsonSerializer.Serialize(encodedUrl)}} }""");

        (string? targetResourceId, string? targetHost) =
            AzureInventoryAdfLinkedServiceTargetExtractor.Extract(document.RootElement, "RestService");

        targetResourceId.Should().BeNull();
        targetHost.Should().Be(host);
    }

    [Fact]
    public void Extract_reads_rest_service_host_from_percent_encoded_url_when_password_is_whitespace_only()
    {
        const string host = "api.contoso.com";
        string encodedUrl = Uri.EscapeDataString($"https://{host}.");

        using JsonDocument document = JsonDocument.Parse(
            $$"""{ "password": "   ", "url": {{JsonSerializer.Serialize(encodedUrl)}} }""");

        (string? targetResourceId, string? targetHost) =
            AzureInventoryAdfLinkedServiceTargetExtractor.Extract(document.RootElement, "RestService");

        targetResourceId.Should().BeNull();
        targetHost.Should().Be(host);
    }

    [Fact]
    public void Extract_reads_http_server_host_from_percent_encoded_url_when_user_name_is_whitespace_only()
    {
        const string host = "internal.contoso.com";
        string encodedUrl = Uri.EscapeDataString($"https://{host}.");

        using JsonDocument document = JsonDocument.Parse(
            $$"""{ "userName": "   ", "url": {{JsonSerializer.Serialize(encodedUrl)}} }""");

        (string? targetResourceId, string? targetHost) =
            AzureInventoryAdfLinkedServiceTargetExtractor.Extract(document.RootElement, "HttpServer");

        targetResourceId.Should().BeNull();
        targetHost.Should().Be(host);
    }

    [Fact]
    public void Extract_reads_http_server_host_from_percent_encoded_url_when_password_is_whitespace_only()
    {
        const string host = "internal.contoso.com";
        string encodedUrl = Uri.EscapeDataString($"https://{host}.");

        using JsonDocument document = JsonDocument.Parse(
            $$"""{ "password": "   ", "url": {{JsonSerializer.Serialize(encodedUrl)}} }""");

        (string? targetResourceId, string? targetHost) =
            AzureInventoryAdfLinkedServiceTargetExtractor.Extract(document.RootElement, "HttpServer");

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
    public void Extract_reads_sql_mi_host_from_percent_encoded_endpoint_property_with_encoded_trailing_dot()
    {
        const string host = "sqlmi1.public.eastus.database.windows.net";
        string encodedHost = Uri.EscapeDataString(host + ".%2E");

        using JsonDocument document = JsonDocument.Parse(
            $$"""{ "endpoint": {{JsonSerializer.Serialize(encodedHost)}} }""");

        (string? targetResourceId, string? targetHost) =
            AzureInventoryAdfLinkedServiceTargetExtractor.Extract(document.RootElement, "AzureSqlMI");

        targetResourceId.Should().BeNull();
        targetHost.Should().Be(host);
    }

    [Fact]
    public void Extract_reads_sql_mi_host_from_percent_encoded_server_property_with_encoded_trailing_dot()
    {
        const string host = "sqlmi1.public.eastus.database.windows.net";
        string encodedHost = Uri.EscapeDataString(host + ".%2E");

        using JsonDocument document = JsonDocument.Parse(
            $$"""{ "server": {{JsonSerializer.Serialize(encodedHost)}} }""");

        (string? targetResourceId, string? targetHost) =
            AzureInventoryAdfLinkedServiceTargetExtractor.Extract(document.RootElement, "AzureSqlMI");

        targetResourceId.Should().BeNull();
        targetHost.Should().Be(host);
    }

    [Fact]
    public void Extract_reads_sql_mi_host_from_percent_encoded_connection_string_server_with_encoded_trailing_dot()
    {
        const string host = "sqlmi1.public.eastus.database.windows.net";
        string encodedHost = Uri.EscapeDataString(host + ".%2E");
        string connectionString = $"Server=tcp:{encodedHost},1433;Database=app;User Id=x;Password=secret";

        using JsonDocument document = JsonDocument.Parse(
            $$"""{ "connectionString": {{JsonSerializer.Serialize(connectionString)}} }""");

        (string? targetResourceId, string? targetHost) =
            AzureInventoryAdfLinkedServiceTargetExtractor.Extract(document.RootElement, "AzureSqlMI");

        targetResourceId.Should().BeNull();
        targetHost.Should().Be(host);
    }

    [Fact]
    public void Extract_reads_synapse_host_from_percent_encoded_connection_string_server_with_encoded_trailing_dot()
    {
        const string host = "mysynapse.sql.azuresynapse.net";
        string encodedHost = Uri.EscapeDataString(host + ".%2E");
        string connectionString = $"Server=tcp:{encodedHost},1433;Database=app;User Id=x;Password=secret";

        using JsonDocument document = JsonDocument.Parse(
            $$"""{ "connectionString": {{JsonSerializer.Serialize(connectionString)}} }""");

        (string? targetResourceId, string? targetHost) =
            AzureInventoryAdfLinkedServiceTargetExtractor.Extract(document.RootElement, "AzureSynapseAnalytics");

        targetResourceId.Should().BeNull();
        targetHost.Should().Be(host);
    }

    [Fact]
    public void Extract_reads_sql_host_from_percent_encoded_server_when_connection_string_is_whitespace_only()
    {
        const string host = "sql1.database.windows.net";
        string encodedHost = Uri.EscapeDataString(host + ".%2E");

        using JsonDocument document = JsonDocument.Parse(
            $$"""{ "server": {{JsonSerializer.Serialize(encodedHost)}}, "connectionString": "   " }""");

        (string? targetResourceId, string? targetHost) =
            AzureInventoryAdfLinkedServiceTargetExtractor.Extract(document.RootElement, "AzureSqlDatabase");

        targetResourceId.Should().BeNull();
        targetHost.Should().Be(host);
    }

    [Fact]
    public void Extract_reads_sql_host_from_percent_encoded_connection_string_server_with_encoded_trailing_dot()
    {
        const string host = "sql1.database.windows.net";
        string encodedHost = Uri.EscapeDataString(host + ".%2E");
        string connectionString = $"Server=tcp:{encodedHost},1433;Database=app;User Id=x;Password=secret";

        using JsonDocument document = JsonDocument.Parse(
            $$"""{ "connectionString": {{JsonSerializer.Serialize(connectionString)}} }""");

        (string? targetResourceId, string? targetHost) =
            AzureInventoryAdfLinkedServiceTargetExtractor.Extract(document.RootElement, "AzureSqlDatabase");

        targetResourceId.Should().BeNull();
        targetHost.Should().Be(host);
    }

    [Fact]
    public void Extract_reads_postgresql_host_from_percent_encoded_server_when_connection_string_is_whitespace_only()
    {
        const string host = "psql1.postgres.database.azure.com";
        string encodedHost = Uri.EscapeDataString(host + ".%2E");

        using JsonDocument document = JsonDocument.Parse(
            $$"""{ "server": {{JsonSerializer.Serialize(encodedHost)}}, "connectionString": "   " }""");

        (string? targetResourceId, string? targetHost) =
            AzureInventoryAdfLinkedServiceTargetExtractor.Extract(document.RootElement, "AzurePostgreSql");

        targetResourceId.Should().BeNull();
        targetHost.Should().Be(host);
    }

    [Fact]
    public void Extract_reads_postgresql_host_from_percent_encoded_server_when_connection_string_is_empty()
    {
        const string host = "psql1.postgres.database.azure.com";
        string encodedHost = Uri.EscapeDataString(host + ".%2E");

        using JsonDocument document = JsonDocument.Parse(
            $$"""{ "server": {{JsonSerializer.Serialize(encodedHost)}}, "connectionString": "" }""");

        (string? targetResourceId, string? targetHost) =
            AzureInventoryAdfLinkedServiceTargetExtractor.Extract(document.RootElement, "AzurePostgreSql");

        targetResourceId.Should().BeNull();
        targetHost.Should().Be(host);
    }

    [Fact]
    public void Extract_reads_postgresql_host_from_percent_encoded_connection_string_server_with_encoded_trailing_dot()
    {
        const string host = "psql1.postgres.database.azure.com";
        string encodedHost = Uri.EscapeDataString(host + ".%2E");
        string connectionString = $"Host={encodedHost};Database=app;Username=x;Password=secret";

        using JsonDocument document = JsonDocument.Parse(
            $$"""{ "connectionString": {{JsonSerializer.Serialize(connectionString)}} }""");

        (string? targetResourceId, string? targetHost) =
            AzureInventoryAdfLinkedServiceTargetExtractor.Extract(document.RootElement, "AzurePostgreSql");

        targetResourceId.Should().BeNull();
        targetHost.Should().Be(host);
    }

    [Fact]
    public void Extract_reads_mysql_host_from_percent_encoded_server_when_connection_string_is_whitespace_only()
    {
        const string host = "mysql1.mysql.database.azure.com";
        string encodedHost = Uri.EscapeDataString(host + ".%2E");

        using JsonDocument document = JsonDocument.Parse(
            $$"""{ "server": {{JsonSerializer.Serialize(encodedHost)}}, "connectionString": "   " }""");

        (string? targetResourceId, string? targetHost) =
            AzureInventoryAdfLinkedServiceTargetExtractor.Extract(document.RootElement, "AzureMySql");

        targetResourceId.Should().BeNull();
        targetHost.Should().Be(host);
    }

    [Fact]
    public void Extract_reads_mysql_host_from_percent_encoded_connection_string_server_with_encoded_trailing_dot()
    {
        const string host = "mysql1.mysql.database.azure.com";
        string encodedHost = Uri.EscapeDataString(host + ".%2E");
        string connectionString = $"Server=tcp:{encodedHost},1433;Database=app;User Id=x;Password=secret";

        using JsonDocument document = JsonDocument.Parse(
            $$"""{ "connectionString": {{JsonSerializer.Serialize(connectionString)}} }""");

        (string? targetResourceId, string? targetHost) =
            AzureInventoryAdfLinkedServiceTargetExtractor.Extract(document.RootElement, "AzureMySql");

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
