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
    public void ParseSettingValues_cosmos_us_government_account_endpoint_without_https_scheme()
    {
        const string value = "AccountEndpoint=myaccount.documents.azure.us;AccountKey=abc";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().ContainSingle();
        parsed[0].Host.Should().Be("myaccount.documents.azure.us");
    }

    [Fact]
    public void ParseSettingValues_cosmos_regional_eus_suffix_without_https_scheme_yields_no_host()
    {
        const string value = "AccountEndpoint=my.documents.azure.eus;AccountKey=abc";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty(
            "Cosmos AccountEndpoint hosts use documents.azure.com/cn/us sovereign suffixes, not .azure.eus");
    }

    [Fact]
    public void ParseSettingValues_storage_account_name_only_without_endpoint_suffix_yields_no_blob_host()
    {
        const string value = "AccountName=only;AccountKey=abc";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_default_endpoints_protocol_without_account_name_yields_no_blob_host()
    {
        const string value = "DefaultEndpointsProtocol=https;AccountKey=abc";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_whitespace_only_account_name_with_endpoint_suffix_yields_no_blob_host()
    {
        const string value = "AccountName=   ;AccountKey=abc;EndpointSuffix=core.windows.net";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_punctuation_only_account_name_with_endpoint_suffix_yields_no_blob_host()
    {
        const string value = "AccountName=---;AccountKey=abc;EndpointSuffix=core.windows.net";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_cosmos_usgov_suffix_without_https_scheme_yields_no_host()
    {
        const string value = "AccountEndpoint=my.documents.azure.usgov;AccountKey=abc";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty(
            "Cosmos AccountEndpoint hosts use documents.azure.com/cn/us sovereign suffixes, not .azure.usgov");
    }

    [Fact]
    public void ParseSettingValues_does_not_declare_cosmos_host_when_account_endpoint_ends_with_usgov_suffix()
    {
        const string value = "AccountEndpoint=acct.documents.azure.usgov;AccountKey=abc";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_microsoft_scloud_cosmos_suffix_without_https_scheme_yields_no_host()
    {
        const string value = "AccountEndpoint=my.documents.azure.microsoft.scloud;AccountKey=abc";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_normalizes_mixed_case_storage_account_name_to_lowercase_blob_host()
    {
        const string value =
            "AccountName=MyStorage;AccountKey=abc;EndpointSuffix=core.windows.net";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().ContainSingle();
        parsed[0].Host.Should().Be("mystorage.blob.core.windows.net");
    }

    [Fact]
    public void ParseSettingValues_eus2_regional_cosmos_suffix_without_https_scheme_yields_no_host()
    {
        const string value = "AccountEndpoint=my.documents.azure.eus2;AccountKey=abc";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_two_letter_account_name_with_endpoint_suffix_yields_no_blob_host()
    {
        const string value = "AccountName=ab;AccountKey=abc;EndpointSuffix=core.windows.net";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_24_character_storage_account_name_with_endpoint_suffix_yields_blob_host()
    {
        const string account = "abcdefghijklmnopqrstuvwx";
        account.Length.Should().Be(24);
        string value = $"AccountName={account};AccountKey=abc;EndpointSuffix=core.windows.net";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().ContainSingle();
        parsed[0].Host.Should().Be($"{account}.blob.core.windows.net");
    }

    [Fact]
    public void ParseSettingValues_25_character_account_name_with_endpoint_suffix_yields_no_blob_host()
    {
        const string account = "abcdefghijklmnopqrstuvwxy";
        account.Length.Should().Be(25);
        string value = $"AccountName={account};AccountKey=abc;EndpointSuffix=core.windows.net";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_eus1_regional_cosmos_suffix_without_https_scheme_yields_no_host()
    {
        const string value = "AccountEndpoint=my.documents.azure.eus1;AccountKey=abc";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_hyphenated_account_name_with_endpoint_suffix_yields_no_blob_host()
    {
        const string value = "AccountName=my-account;AccountKey=abc;EndpointSuffix=core.windows.net";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_wus2_regional_cosmos_suffix_without_https_scheme_yields_no_host()
    {
        const string value = "AccountEndpoint=my.documents.azure.wus2;AccountKey=abc";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_underscore_account_name_with_endpoint_suffix_yields_no_blob_host()
    {
        const string value = "AccountName=my_account;AccountKey=abc;EndpointSuffix=core.windows.net";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_cus_regional_cosmos_suffix_without_https_scheme_yields_no_host()
    {
        const string value = "AccountEndpoint=my.documents.azure.cus;AccountKey=abc";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_two_digit_account_name_with_endpoint_suffix_yields_no_blob_host()
    {
        const string value = "AccountName=12;AccountKey=abc;EndpointSuffix=core.windows.net";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_ne_regional_cosmos_suffix_without_https_scheme_yields_no_host()
    {
        const string value = "AccountEndpoint=my.documents.azure.ne;AccountKey=abc";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_three_letter_numeric_account_name_with_endpoint_suffix_yields_blob_host()
    {
        const string value = "AccountName=123;AccountKey=abc;EndpointSuffix=core.windows.net";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().ContainSingle();
        parsed[0].Host.Should().Be("123.blob.core.windows.net");
    }

    [Fact]
    public void ParseSettingValues_se_regional_cosmos_suffix_without_https_scheme_yields_no_host()
    {
        const string value = "AccountEndpoint=my.documents.azure.se;AccountKey=abc";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_account_name_with_digit_and_hyphen_with_endpoint_suffix_yields_no_blob_host()
    {
        const string value = "AccountName=1a-;AccountKey=abc;EndpointSuffix=core.windows.net";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_uk_regional_cosmos_suffix_without_https_scheme_yields_no_host()
    {
        const string value = "AccountEndpoint=my.documents.azure.uk;AccountKey=abc";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_account_name_with_consecutive_hyphens_with_endpoint_suffix_yields_no_blob_host()
    {
        const string value = "AccountName=abc--def;AccountKey=abc;EndpointSuffix=core.windows.net";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }
}
