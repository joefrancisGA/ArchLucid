using ArchLucid.Core.AzureExtractor;

using FluentAssertions;

namespace ArchLucid.Core.Tests.AzureExtractor;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class AzureInventoryAppSettingHostConnectionStringParserTests
{
    [Fact]
    public void ParseSettingValues_storage_account_key_yields_blob_host_without_key()
    {
        const string value =
            "DefaultEndpointsProtocol=https;AccountName=starchlucidevarts;AccountKey=abc;EndpointSuffix=core.windows.net";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().ContainSingle();
        parsed[0].Host.Should().Be("starchlucidevarts.blob.core.windows.net");
        $"{parsed[0]}".Should().NotContain("abc");
    }

    [Fact]
    public void ParseSettingValues_queue_endpoint_yields_queue_host_only()
    {
        const string value =
            "DefaultEndpointsProtocol=https;AccountName=starch;AccountKey=abc;EndpointSuffix=core.windows.net;QueueEndpoint=https://starch.queue.core.windows.net/";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().ContainSingle();
        parsed[0].Host.Should().Be("starch.queue.core.windows.net");
    }

    [Fact]
    public void ParseSettingValues_service_bus_endpoint_with_port_yields_host_including_port()
    {
        const string value =
            "Endpoint=sb://orders.servicebus.windows.net:5671/;SharedAccessKeyName=RootManageSharedAccessKey;SharedAccessKey=abc";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().ContainSingle();
        parsed[0].Host.Should().Be("orders.servicebus.windows.net:5671");
    }

    [Fact]
    public void ParseSettingValues_service_bus_endpoint_yields_host_without_shared_access_key()
    {
        const string value =
            "Endpoint=sb://orders.servicebus.windows.net/;SharedAccessKeyName=RootManageSharedAccessKey;SharedAccessKey=abc";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().ContainSingle();
        parsed[0].Host.Should().Be("orders.servicebus.windows.net");
        $"{parsed[0]}".Should().NotContain("abc");
    }

    [Fact]
    public void ParseSettingValues_redis_yields_host_without_password()
    {
        const string value = "myaccount.redis.cache.windows.net,password=abc,ssl=True";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().ContainSingle();
        parsed[0].Host.Should().Be("myaccount.redis.cache.windows.net");
        $"{parsed[0]}".Should().NotContain("abc");
    }

    [Fact]
    public void ParseSettingValues_managed_redis_azure_net_hostname()
    {
        const string value = "myaccount.eastus.redis.azure.net,password=abc,ssl=True";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().ContainSingle();
        parsed[0].Host.Should().Be("myaccount.eastus.redis.azure.net");
        $"{parsed[0]}".Should().NotContain("abc");
    }

    [Fact]
    public void ParseSettingValues_cosmos_documents_host()
    {
        const string value = "AccountEndpoint=https://myaccount.documents.azure.com:443/;AccountKey=abc";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().ContainSingle();
        parsed[0].Host.Should().Be("myaccount.documents.azure.com");
    }

    [Fact]
    public void ParseSettingValues_cosmos_china_account_endpoint_without_https_scheme()
    {
        const string value = "AccountEndpoint=mycosmos.documents.azure.cn;AccountKey=abc";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().ContainSingle();
        parsed[0].Host.Should().Be("mycosmos.documents.azure.cn");
    }

    [Fact]
    public void ParseSettingValues_cosmos_public_account_endpoint_without_https_scheme()
    {
        const string value = "AccountEndpoint=myaccount.documents.azure.com;AccountKey=abc";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().ContainSingle();
        parsed[0].Host.Should().Be("myaccount.documents.azure.com");
    }

    [Fact]
    public void ParseSettingValues_storage_account_name_only_without_endpoint_suffix_yields_no_blob_host()
    {
        const string value = "AccountName=only;AccountKey=abc";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }
}
