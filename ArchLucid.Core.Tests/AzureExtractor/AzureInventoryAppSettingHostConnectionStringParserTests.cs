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
    public void ParseSettingValues_26_character_account_name_with_endpoint_suffix_yields_no_blob_host()
    {
        const string account = "abcdefghijklmnopqrstuvwxyz";
        account.Length.Should().Be(26);
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

    [Fact]
    public void ParseSettingValues_de_regional_cosmos_suffix_without_https_scheme_yields_no_host()
    {
        const string value = "AccountEndpoint=my.documents.azure.de;AccountKey=abc";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_account_name_ending_with_hyphen_with_endpoint_suffix_yields_no_blob_host()
    {
        const string value = "AccountName=validname-;AccountKey=abc;EndpointSuffix=core.windows.net";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_fr_regional_cosmos_suffix_without_https_scheme_yields_no_host()
    {
        const string value = "AccountEndpoint=my.documents.azure.fr;AccountKey=abc";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_account_name_starting_with_hyphen_with_endpoint_suffix_yields_no_blob_host()
    {
        const string value = "AccountName=-validname;AccountKey=abc;EndpointSuffix=core.windows.net";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_jp_regional_cosmos_suffix_without_https_scheme_yields_no_host()
    {
        const string value = "AccountEndpoint=my.documents.azure.jp;AccountKey=abc";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_mixed_case_account_name_with_endpoint_suffix_yields_lowercase_blob_host()
    {
        const string value = "AccountName=ValidName;AccountKey=abc;EndpointSuffix=core.windows.net";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().ContainSingle();
        parsed[0].Host.Should().Be("validname.blob.core.windows.net");
    }

    [Fact]
    public void ParseSettingValues_it_regional_cosmos_suffix_without_https_scheme_yields_no_host()
    {
        const string value = "AccountEndpoint=my.documents.azure.it;AccountKey=abc";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_es_regional_cosmos_suffix_without_https_scheme_yields_no_host()
    {
        const string value = "AccountEndpoint=my.documents.azure.es;AccountKey=abc";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_pl_regional_cosmos_suffix_without_https_scheme_yields_no_host()
    {
        const string value = "AccountEndpoint=my.documents.azure.pl;AccountKey=abc";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_ch_regional_cosmos_suffix_without_https_scheme_yields_no_host()
    {
        const string value = "AccountEndpoint=my.documents.azure.ch;AccountKey=abc";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_br_regional_cosmos_suffix_without_https_scheme_yields_no_host()
    {
        const string value = "AccountEndpoint=my.documents.azure.br;AccountKey=abc";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_interior_period_account_name_with_endpoint_suffix_yields_no_blob_host()
    {
        const string value = "AccountName=my.account;AccountKey=abc;EndpointSuffix=core.windows.net";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_au_regional_cosmos_suffix_without_https_scheme_yields_no_host()
    {
        const string value = "AccountEndpoint=my.documents.azure.au;AccountKey=abc";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_trailing_period_account_name_with_endpoint_suffix_yields_no_blob_host()
    {
        const string value = "AccountName=validname.;AccountKey=abc;EndpointSuffix=core.windows.net";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_nz_regional_cosmos_suffix_without_https_scheme_yields_no_host()
    {
        const string value = "AccountEndpoint=my.documents.azure.nz;AccountKey=abc";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_leading_period_account_name_with_endpoint_suffix_yields_no_blob_host()
    {
        const string value = "AccountName=.validname;AccountKey=abc;EndpointSuffix=core.windows.net";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_ca_regional_cosmos_suffix_without_https_scheme_yields_no_host()
    {
        const string value = "AccountEndpoint=my.documents.azure.ca;AccountKey=abc";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_in_regional_cosmos_suffix_without_https_scheme_yields_no_host()
    {
        const string value = "AccountEndpoint=my.documents.azure.in;AccountKey=abc";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_embedded_space_account_name_with_endpoint_suffix_yields_no_blob_host()
    {
        const string value = "AccountName=valid name;AccountKey=abc;EndpointSuffix=core.windows.net";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_mx_regional_cosmos_suffix_without_https_scheme_yields_no_host()
    {
        const string value = "AccountEndpoint=my.documents.azure.mx;AccountKey=abc";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_plus_sign_account_name_with_endpoint_suffix_yields_no_blob_host()
    {
        const string value = "AccountName=valid+name;AccountKey=abc;EndpointSuffix=core.windows.net";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_sg_regional_cosmos_suffix_without_https_scheme_yields_no_host()
    {
        const string value = "AccountEndpoint=my.documents.azure.sg;AccountKey=abc";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_comma_in_account_name_with_endpoint_suffix_yields_no_blob_host()
    {
        const string value = "AccountName=valid,name;AccountKey=abc;EndpointSuffix=core.windows.net";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_kr_regional_cosmos_suffix_without_https_scheme_yields_no_host()
    {
        const string value = "AccountEndpoint=my.documents.azure.kr;AccountKey=abc";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_equals_sign_in_account_name_with_endpoint_suffix_yields_no_blob_host()
    {
        const string value = "AccountName=valid=name;AccountKey=abc;EndpointSuffix=core.windows.net";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_tw_regional_cosmos_suffix_without_https_scheme_yields_no_host()
    {
        const string value = "AccountEndpoint=my.documents.azure.tw;AccountKey=abc";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_ampersand_in_account_name_with_endpoint_suffix_yields_no_blob_host()
    {
        const string value = "AccountName=valid&name;AccountKey=abc;EndpointSuffix=core.windows.net";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_hk_regional_cosmos_suffix_without_https_scheme_yields_no_host()
    {
        const string value = "AccountEndpoint=my.documents.azure.hk;AccountKey=abc";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_hash_sign_in_account_name_with_endpoint_suffix_yields_no_blob_host()
    {
        const string value = "AccountName=valid#name;AccountKey=abc;EndpointSuffix=core.windows.net";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_my_regional_cosmos_suffix_without_https_scheme_yields_no_host()
    {
        const string value = "AccountEndpoint=my.documents.azure.my;AccountKey=abc";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_dollar_sign_in_account_name_with_endpoint_suffix_yields_no_blob_host()
    {
        const string value = "AccountName=valid$name;AccountKey=abc;EndpointSuffix=core.windows.net";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_id_regional_cosmos_suffix_without_https_scheme_yields_no_host()
    {
        const string value = "AccountEndpoint=my.documents.azure.id;AccountKey=abc";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_percent_sign_in_account_name_with_endpoint_suffix_yields_no_blob_host()
    {
        const string value = "AccountName=valid%name;AccountKey=abc;EndpointSuffix=core.windows.net";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_ph_regional_cosmos_suffix_without_https_scheme_yields_no_host()
    {
        const string value = "AccountEndpoint=my.documents.azure.ph;AccountKey=abc";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_caret_in_account_name_with_endpoint_suffix_yields_no_blob_host()
    {
        const string value = "AccountName=valid^name;AccountKey=abc;EndpointSuffix=core.windows.net";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_vn_regional_cosmos_suffix_without_https_scheme_yields_no_host()
    {
        const string value = "AccountEndpoint=my.documents.azure.vn;AccountKey=abc";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_asterisk_in_account_name_with_endpoint_suffix_yields_no_blob_host()
    {
        const string value = "AccountName=valid*name;AccountKey=abc;EndpointSuffix=core.windows.net";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_th_regional_cosmos_suffix_without_https_scheme_yields_no_host()
    {
        const string value = "AccountEndpoint=my.documents.azure.th;AccountKey=abc";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_question_mark_in_account_name_with_endpoint_suffix_yields_no_blob_host()
    {
        const string value = "AccountName=valid?name;AccountKey=abc;EndpointSuffix=core.windows.net";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_pk_regional_cosmos_suffix_without_https_scheme_yields_no_host()
    {
        const string value = "AccountEndpoint=my.documents.azure.pk;AccountKey=abc";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_pipe_in_account_name_with_endpoint_suffix_yields_no_blob_host()
    {
        const string value = "AccountName=valid|name;AccountKey=abc;EndpointSuffix=core.windows.net";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_bd_regional_cosmos_suffix_without_https_scheme_yields_no_host()
    {
        const string value = "AccountEndpoint=my.documents.azure.bd;AccountKey=abc";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_backslash_in_account_name_with_endpoint_suffix_yields_no_blob_host()
    {
        const string value = @"AccountName=valid\name;AccountKey=abc;EndpointSuffix=core.windows.net";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_lk_regional_cosmos_suffix_without_https_scheme_yields_no_host()
    {
        const string value = "AccountEndpoint=my.documents.azure.lk;AccountKey=abc";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_colon_in_account_name_with_endpoint_suffix_yields_no_blob_host()
    {
        const string value = "AccountName=valid:name;AccountKey=abc;EndpointSuffix=core.windows.net";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_np_regional_cosmos_suffix_without_https_scheme_yields_no_host()
    {
        const string value = "AccountEndpoint=my.documents.azure.np;AccountKey=abc";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_tilde_in_account_name_with_endpoint_suffix_yields_no_blob_host()
    {
        const string value = "AccountName=valid~name;AccountKey=abc;EndpointSuffix=core.windows.net";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_mm_regional_cosmos_suffix_without_https_scheme_yields_no_host()
    {
        const string value = "AccountEndpoint=my.documents.azure.mm;AccountKey=abc";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_grave_accent_in_account_name_with_endpoint_suffix_yields_no_blob_host()
    {
        const string value = "AccountName=valid\u0060name;AccountKey=abc;EndpointSuffix=core.windows.net";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_bn_regional_cosmos_suffix_without_https_scheme_yields_no_host()
    {
        const string value = "AccountEndpoint=my.documents.azure.bn;AccountKey=abc";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_acute_accent_in_account_name_with_endpoint_suffix_yields_no_blob_host()
    {
        const string value = "AccountName=valid\u00E9name;AccountKey=abc;EndpointSuffix=core.windows.net";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_bt_regional_cosmos_suffix_without_https_scheme_yields_no_host()
    {
        const string value = "AccountEndpoint=my.documents.azure.bt;AccountKey=abc";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_cedilla_in_account_name_with_endpoint_suffix_yields_no_blob_host()
    {
        const string value = "AccountName=valid\u00E7name;AccountKey=abc;EndpointSuffix=core.windows.net";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_bw_regional_cosmos_suffix_without_https_scheme_yields_no_host()
    {
        const string value = "AccountEndpoint=my.documents.azure.bw;AccountKey=abc";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_circumflex_in_account_name_with_endpoint_suffix_yields_no_blob_host()
    {
        const string value = "AccountName=valid\u00E2name;AccountKey=abc;EndpointSuffix=core.windows.net";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_bz_regional_cosmos_suffix_without_https_scheme_yields_no_host()
    {
        const string value = "AccountEndpoint=my.documents.azure.bz;AccountKey=abc";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_diaeresis_in_account_name_with_endpoint_suffix_yields_no_blob_host()
    {
        const string value = "AccountName=valid\u00EBname;AccountKey=abc;EndpointSuffix=core.windows.net";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_by_regional_cosmos_suffix_without_https_scheme_yields_no_host()
    {
        const string value = "AccountEndpoint=my.documents.azure.by;AccountKey=abc";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_umlaut_in_account_name_with_endpoint_suffix_yields_no_blob_host()
    {
        const string value = "AccountName=valid\u00F6name;AccountKey=abc;EndpointSuffix=core.windows.net";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_ba_regional_cosmos_suffix_without_https_scheme_yields_no_host()
    {
        const string value = "AccountEndpoint=my.documents.azure.ba;AccountKey=abc";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_u_with_diaeresis_in_account_name_with_endpoint_suffix_yields_no_blob_host()
    {
        const string value = "AccountName=valid\u00FCname;AccountKey=abc;EndpointSuffix=core.windows.net";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_bg_regional_cosmos_suffix_without_https_scheme_yields_no_host()
    {
        const string value = "AccountEndpoint=my.documents.azure.bg;AccountKey=abc";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_i_with_diaeresis_in_account_name_with_endpoint_suffix_yields_no_blob_host()
    {
        const string value = "AccountName=valid\u00EFname;AccountKey=abc;EndpointSuffix=core.windows.net";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_bh_regional_cosmos_suffix_without_https_scheme_yields_no_host()
    {
        const string value = "AccountEndpoint=my.documents.azure.bh;AccountKey=abc";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_n_with_tilde_in_account_name_with_endpoint_suffix_yields_no_blob_host()
    {
        const string value = "AccountName=valid\u00F1name;AccountKey=abc;EndpointSuffix=core.windows.net";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_bi_regional_cosmos_suffix_without_https_scheme_yields_no_host()
    {
        const string value = "AccountEndpoint=my.documents.azure.bi;AccountKey=abc";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_a_with_ring_in_account_name_with_endpoint_suffix_yields_no_blob_host()
    {
        const string value = "AccountName=valid\u00E5name;AccountKey=abc;EndpointSuffix=core.windows.net";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_bj_regional_cosmos_suffix_without_https_scheme_yields_no_host()
    {
        const string value = "AccountEndpoint=my.documents.azure.bj;AccountKey=abc";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_a_with_diaeresis_in_account_name_with_endpoint_suffix_yields_no_blob_host()
    {
        const string value = "AccountName=valid\u00E4name;AccountKey=abc;EndpointSuffix=core.windows.net";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_bk_regional_cosmos_suffix_without_https_scheme_yields_no_host()
    {
        const string value = "AccountEndpoint=my.documents.azure.bk;AccountKey=abc";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_bl_regional_cosmos_suffix_without_https_scheme_yields_no_host()
    {
        const string value = "AccountEndpoint=my.documents.azure.bl;AccountKey=abc";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_bm_regional_cosmos_suffix_without_https_scheme_yields_no_host()
    {
        const string value = "AccountEndpoint=my.documents.azure.bm;AccountKey=abc";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_bo_regional_cosmos_suffix_without_https_scheme_yields_no_host()
    {
        const string value = "AccountEndpoint=my.documents.azure.bo;AccountKey=abc";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_bp_regional_cosmos_suffix_without_https_scheme_yields_no_host()
    {
        const string value = "AccountEndpoint=my.documents.azure.bp;AccountKey=abc";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_bq_regional_cosmos_suffix_without_https_scheme_yields_no_host()
    {
        const string value = "AccountEndpoint=my.documents.azure.bq;AccountKey=abc";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_bs_regional_cosmos_suffix_without_https_scheme_yields_no_host()
    {
        const string value = "AccountEndpoint=my.documents.azure.bs;AccountKey=abc";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_bu_regional_cosmos_suffix_without_https_scheme_yields_no_host()
    {
        const string value = "AccountEndpoint=my.documents.azure.bu;AccountKey=abc";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_bv_regional_cosmos_suffix_without_https_scheme_yields_no_host()
    {
        const string value = "AccountEndpoint=my.documents.azure.bv;AccountKey=abc";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_bx_regional_cosmos_suffix_without_https_scheme_yields_no_host()
    {
        const string value = "AccountEndpoint=my.documents.azure.bx;AccountKey=abc";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_cb_regional_cosmos_suffix_without_https_scheme_yields_no_host()
    {
        const string value = "AccountEndpoint=my.documents.azure.cb;AccountKey=abc";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_cc_regional_cosmos_suffix_without_https_scheme_yields_no_host()
    {
        const string value = "AccountEndpoint=my.documents.azure.cc;AccountKey=abc";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_cd_regional_cosmos_suffix_without_https_scheme_yields_no_host()
    {
        const string value = "AccountEndpoint=my.documents.azure.cd;AccountKey=abc";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_ce_regional_cosmos_suffix_without_https_scheme_yields_no_host()
    {
        const string value = "AccountEndpoint=my.documents.azure.ce;AccountKey=abc";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_cf_regional_cosmos_suffix_without_https_scheme_yields_no_host()
    {
        const string value = "AccountEndpoint=my.documents.azure.cf;AccountKey=abc";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_cg_regional_cosmos_suffix_without_https_scheme_yields_no_host()
    {
        const string value = "AccountEndpoint=my.documents.azure.cg;AccountKey=abc";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_ci_regional_cosmos_suffix_without_https_scheme_yields_no_host()
    {
        const string value = "AccountEndpoint=my.documents.azure.ci;AccountKey=abc";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_cj_regional_cosmos_suffix_without_https_scheme_yields_no_host()
    {
        const string value = "AccountEndpoint=my.documents.azure.cj;AccountKey=abc";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_ck_regional_cosmos_suffix_without_https_scheme_yields_no_host()
    {
        const string value = "AccountEndpoint=my.documents.azure.ck;AccountKey=abc";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_cl_regional_cosmos_suffix_without_https_scheme_yields_no_host()
    {
        const string value = "AccountEndpoint=my.documents.azure.cl;AccountKey=abc";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_cm_regional_cosmos_suffix_without_https_scheme_yields_no_host()
    {
        const string value = "AccountEndpoint=my.documents.azure.cm;AccountKey=abc";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_co_regional_cosmos_suffix_without_https_scheme_yields_no_host()
    {
        const string value = "AccountEndpoint=my.documents.azure.co;AccountKey=abc";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_cp_regional_cosmos_suffix_without_https_scheme_yields_no_host()
    {
        const string value = "AccountEndpoint=my.documents.azure.cp;AccountKey=abc";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_cq_regional_cosmos_suffix_without_https_scheme_yields_no_host()
    {
        const string value = "AccountEndpoint=my.documents.azure.cq;AccountKey=abc";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_cr_regional_cosmos_suffix_without_https_scheme_yields_no_host()
    {
        const string value = "AccountEndpoint=my.documents.azure.cr;AccountKey=abc";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_cs_regional_cosmos_suffix_without_https_scheme_yields_no_host()
    {
        const string value = "AccountEndpoint=my.documents.azure.cs;AccountKey=abc";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_ct_regional_cosmos_suffix_without_https_scheme_yields_no_host()
    {
        const string value = "AccountEndpoint=my.documents.azure.ct;AccountKey=abc";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_cu_regional_cosmos_suffix_without_https_scheme_yields_no_host()
    {
        const string value = "AccountEndpoint=my.documents.azure.cu;AccountKey=abc";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_cv_regional_cosmos_suffix_without_https_scheme_yields_no_host()
    {
        const string value = "AccountEndpoint=my.documents.azure.cv;AccountKey=abc";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_cw_regional_cosmos_suffix_without_https_scheme_yields_no_host()
    {
        const string value = "AccountEndpoint=my.documents.azure.cw;AccountKey=abc";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_cx_regional_cosmos_suffix_without_https_scheme_yields_no_host()
    {
        const string value = "AccountEndpoint=my.documents.azure.cx;AccountKey=abc";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_cy_regional_cosmos_suffix_without_https_scheme_yields_no_host()
    {
        const string value = "AccountEndpoint=my.documents.azure.cy;AccountKey=abc";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_cz_regional_cosmos_suffix_without_https_scheme_yields_no_host()
    {
        const string value = "AccountEndpoint=my.documents.azure.cz;AccountKey=abc";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_da_regional_cosmos_suffix_without_https_scheme_yields_no_host()
    {
        const string value = "AccountEndpoint=my.documents.azure.da;AccountKey=abc";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_db_regional_cosmos_suffix_without_https_scheme_yields_no_host()
    {
        const string value = "AccountEndpoint=my.documents.azure.db;AccountKey=abc";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_dc_regional_cosmos_suffix_without_https_scheme_yields_no_host()
    {
        const string value = "AccountEndpoint=my.documents.azure.dc;AccountKey=abc";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_dd_regional_cosmos_suffix_without_https_scheme_yields_no_host()
    {
        const string value = "AccountEndpoint=my.documents.azure.dd;AccountKey=abc";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_df_regional_cosmos_suffix_without_https_scheme_yields_no_host()
    {
        const string value = "AccountEndpoint=my.documents.azure.df;AccountKey=abc";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_dg_regional_cosmos_suffix_without_https_scheme_yields_no_host()
    {
        const string value = "AccountEndpoint=my.documents.azure.dg;AccountKey=abc";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_dh_regional_cosmos_suffix_without_https_scheme_yields_no_host()
    {
        const string value = "AccountEndpoint=my.documents.azure.dh;AccountKey=abc";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_di_regional_cosmos_suffix_without_https_scheme_yields_no_host()
    {
        const string value = "AccountEndpoint=my.documents.azure.di;AccountKey=abc";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_dj_regional_cosmos_suffix_without_https_scheme_yields_no_host()
    {
        const string value = "AccountEndpoint=my.documents.azure.dj;AccountKey=abc";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_dk_regional_cosmos_suffix_without_https_scheme_yields_no_host()
    {
        const string value = "AccountEndpoint=my.documents.azure.dk;AccountKey=abc";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_dl_regional_cosmos_suffix_without_https_scheme_yields_no_host()
    {
        const string value = "AccountEndpoint=my.documents.azure.dl;AccountKey=abc";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_dm_regional_cosmos_suffix_without_https_scheme_yields_no_host()
    {
        const string value = "AccountEndpoint=my.documents.azure.dm;AccountKey=abc";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_dn_regional_cosmos_suffix_without_https_scheme_yields_no_host()
    {
        const string value = "AccountEndpoint=my.documents.azure.dn;AccountKey=abc";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_do_regional_cosmos_suffix_without_https_scheme_yields_no_host()
    {
        const string value = "AccountEndpoint=my.documents.azure.do;AccountKey=abc";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_dp_regional_cosmos_suffix_without_https_scheme_yields_no_host()
    {
        const string value = "AccountEndpoint=my.documents.azure.dp;AccountKey=abc";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_dq_regional_cosmos_suffix_without_https_scheme_yields_no_host()
    {
        const string value = "AccountEndpoint=my.documents.azure.dq;AccountKey=abc";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_dr_regional_cosmos_suffix_without_https_scheme_yields_no_host()
    {
        const string value = "AccountEndpoint=my.documents.azure.dr;AccountKey=abc";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_ds_regional_cosmos_suffix_without_https_scheme_yields_no_host()
    {
        const string value = "AccountEndpoint=my.documents.azure.ds;AccountKey=abc";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_dt_regional_cosmos_suffix_without_https_scheme_yields_no_host()
    {
        const string value = "AccountEndpoint=my.documents.azure.dt;AccountKey=abc";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_du_regional_cosmos_suffix_without_https_scheme_yields_no_host()
    {
        const string value = "AccountEndpoint=my.documents.azure.du;AccountKey=abc";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_dv_regional_cosmos_suffix_without_https_scheme_yields_no_host()
    {
        const string value = "AccountEndpoint=my.documents.azure.dv;AccountKey=abc";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_dw_regional_cosmos_suffix_without_https_scheme_yields_no_host()
    {
        const string value = "AccountEndpoint=my.documents.azure.dw;AccountKey=abc";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_dx_regional_cosmos_suffix_without_https_scheme_yields_no_host()
    {
        const string value = "AccountEndpoint=my.documents.azure.dx;AccountKey=abc";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_dy_regional_cosmos_suffix_without_https_scheme_yields_no_host()
    {
        const string value = "AccountEndpoint=my.documents.azure.dy;AccountKey=abc";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_dz_regional_cosmos_suffix_without_https_scheme_yields_no_host()
    {
        const string value = "AccountEndpoint=my.documents.azure.dz;AccountKey=abc";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_ea_regional_cosmos_suffix_without_https_scheme_yields_no_host()
    {
        const string value = "AccountEndpoint=my.documents.azure.ea;AccountKey=abc";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_eb_regional_cosmos_suffix_without_https_scheme_yields_no_host()
    {
        const string value = "AccountEndpoint=my.documents.azure.eb;AccountKey=abc";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_ec_regional_cosmos_suffix_without_https_scheme_yields_no_host()
    {
        const string value = "AccountEndpoint=my.documents.azure.ec;AccountKey=abc";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_ed_regional_cosmos_suffix_without_https_scheme_yields_no_host()
    {
        const string value = "AccountEndpoint=my.documents.azure.ed;AccountKey=abc";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_ee_regional_cosmos_suffix_without_https_scheme_yields_no_host()
    {
        const string value = "AccountEndpoint=my.documents.azure.ee;AccountKey=abc";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_ef_regional_cosmos_suffix_without_https_scheme_yields_no_host()
    {
        const string value = "AccountEndpoint=my.documents.azure.ef;AccountKey=abc";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_eg_regional_cosmos_suffix_without_https_scheme_yields_no_host()
    {
        const string value = "AccountEndpoint=my.documents.azure.eg;AccountKey=abc";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_eh_regional_cosmos_suffix_without_https_scheme_yields_no_host()
    {
        const string value = "AccountEndpoint=my.documents.azure.eh;AccountKey=abc";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_ei_regional_cosmos_suffix_without_https_scheme_yields_no_host()
    {
        const string value = "AccountEndpoint=my.documents.azure.ei;AccountKey=abc";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_ej_regional_cosmos_suffix_without_https_scheme_yields_no_host()
    {
        const string value = "AccountEndpoint=my.documents.azure.ej;AccountKey=abc";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_ek_regional_cosmos_suffix_without_https_scheme_yields_no_host()
    {
        const string value = "AccountEndpoint=my.documents.azure.ek;AccountKey=abc";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_el_regional_cosmos_suffix_without_https_scheme_yields_no_host()
    {
        const string value = "AccountEndpoint=my.documents.azure.el;AccountKey=abc";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_em_regional_cosmos_suffix_without_https_scheme_yields_no_host()
    {
        const string value = "AccountEndpoint=my.documents.azure.em;AccountKey=abc";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_en_regional_cosmos_suffix_without_https_scheme_yields_no_host()
    {
        const string value = "AccountEndpoint=my.documents.azure.en;AccountKey=abc";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_eo_regional_cosmos_suffix_without_https_scheme_yields_no_host()
    {
        const string value = "AccountEndpoint=my.documents.azure.eo;AccountKey=abc";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_ep_regional_cosmos_suffix_without_https_scheme_yields_no_host()
    {
        const string value = "AccountEndpoint=my.documents.azure.ep;AccountKey=abc";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_eq_regional_cosmos_suffix_without_https_scheme_yields_no_host()
    {
        const string value = "AccountEndpoint=my.documents.azure.eq;AccountKey=abc";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_er_regional_cosmos_suffix_without_https_scheme_yields_no_host()
    {
        const string value = "AccountEndpoint=my.documents.azure.er;AccountKey=abc";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_et_regional_cosmos_suffix_without_https_scheme_yields_no_host()
    {
        const string value = "AccountEndpoint=my.documents.azure.et;AccountKey=abc";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_eu_regional_cosmos_suffix_without_https_scheme_yields_no_host()
    {
        const string value = "AccountEndpoint=my.documents.azure.eu;AccountKey=abc";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_ev_regional_cosmos_suffix_without_https_scheme_yields_no_host()
    {
        const string value = "AccountEndpoint=my.documents.azure.ev;AccountKey=abc";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_ew_regional_cosmos_suffix_without_https_scheme_yields_no_host()
    {
        const string value = "AccountEndpoint=my.documents.azure.ew;AccountKey=abc";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_ex_regional_cosmos_suffix_without_https_scheme_yields_no_host()
    {
        const string value = "AccountEndpoint=my.documents.azure.ex;AccountKey=abc";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_ey_regional_cosmos_suffix_without_https_scheme_yields_no_host()
    {
        const string value = "AccountEndpoint=my.documents.azure.ey;AccountKey=abc";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_ez_regional_cosmos_suffix_without_https_scheme_yields_no_host()
    {
        const string value = "AccountEndpoint=my.documents.azure.ez;AccountKey=abc";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_e0_regional_cosmos_suffix_without_https_scheme_yields_no_host()
    {
        const string value = "AccountEndpoint=my.documents.azure.e0;AccountKey=abc";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_e1_regional_cosmos_suffix_without_https_scheme_yields_no_host()
    {
        const string value = "AccountEndpoint=my.documents.azure.e1;AccountKey=abc";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_e2_regional_cosmos_suffix_without_https_scheme_yields_no_host()
    {
        const string value = "AccountEndpoint=my.documents.azure.e2;AccountKey=abc";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_e3_regional_cosmos_suffix_without_https_scheme_yields_no_host()
    {
        const string value = "AccountEndpoint=my.documents.azure.e3;AccountKey=abc";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_e4_regional_cosmos_suffix_without_https_scheme_yields_no_host()
    {
        const string value = "AccountEndpoint=my.documents.azure.e4;AccountKey=abc";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_e5_regional_cosmos_suffix_without_https_scheme_yields_no_host()
    {
        const string value = "AccountEndpoint=my.documents.azure.e5;AccountKey=abc";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_e6_regional_cosmos_suffix_without_https_scheme_yields_no_host()
    {
        const string value = "AccountEndpoint=my.documents.azure.e6;AccountKey=abc";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_e7_regional_cosmos_suffix_without_https_scheme_yields_no_host()
    {
        const string value = "AccountEndpoint=my.documents.azure.e7;AccountKey=abc";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_e8_regional_cosmos_suffix_without_https_scheme_yields_no_host()
    {
        const string value = "AccountEndpoint=my.documents.azure.e8;AccountKey=abc";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_e9_regional_cosmos_suffix_without_https_scheme_yields_no_host()
    {
        const string value = "AccountEndpoint=my.documents.azure.e9;AccountKey=abc";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_e10_regional_cosmos_suffix_without_https_scheme_yields_no_host()
    {
        const string value = "AccountEndpoint=my.documents.azure.e10;AccountKey=abc";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_e11_regional_cosmos_suffix_without_https_scheme_yields_no_host()
    {
        const string value = "AccountEndpoint=my.documents.azure.e11;AccountKey=abc";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_e12_regional_cosmos_suffix_without_https_scheme_yields_no_host()
    {
        const string value = "AccountEndpoint=my.documents.azure.e12;AccountKey=abc";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_e13_regional_cosmos_suffix_without_https_scheme_yields_no_host()
    {
        const string value = "AccountEndpoint=my.documents.azure.e13;AccountKey=abc";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_e14_regional_cosmos_suffix_without_https_scheme_yields_no_host()
    {
        const string value = "AccountEndpoint=my.documents.azure.e14;AccountKey=abc";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_e15_regional_cosmos_suffix_without_https_scheme_yields_no_host()
    {
        const string value = "AccountEndpoint=my.documents.azure.e15;AccountKey=abc";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_e16_regional_cosmos_suffix_without_https_scheme_yields_no_host()
    {
        const string value = "AccountEndpoint=my.documents.azure.e16;AccountKey=abc";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_e17_regional_cosmos_suffix_without_https_scheme_yields_no_host()
    {
        const string value = "AccountEndpoint=my.documents.azure.e17;AccountKey=abc";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_e18_regional_cosmos_suffix_without_https_scheme_yields_no_host()
    {
        const string value = "AccountEndpoint=my.documents.azure.e18;AccountKey=abc";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_e19_regional_cosmos_suffix_without_https_scheme_yields_no_host()
    {
        const string value = "AccountEndpoint=my.documents.azure.e19;AccountKey=abc";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_e20_regional_cosmos_suffix_without_https_scheme_yields_no_host()
    {
        const string value = "AccountEndpoint=my.documents.azure.e20;AccountKey=abc";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_eszett_in_account_name_with_endpoint_suffix_yields_no_blob_host()
    {
        const string value = "AccountName=valid\u00DFname;AccountKey=abc;EndpointSuffix=core.windows.net";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_thorn_in_account_name_with_endpoint_suffix_yields_no_blob_host()
    {
        const string value = "AccountName=valid\u00FEname;AccountKey=abc;EndpointSuffix=core.windows.net";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_y_with_diaeresis_in_account_name_with_endpoint_suffix_yields_no_blob_host()
    {
        const string value = "AccountName=valid\u00FFname;AccountKey=abc;EndpointSuffix=core.windows.net";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_y_with_acute_in_account_name_with_endpoint_suffix_yields_no_blob_host()
    {
        const string value = "AccountName=valid\u00FDname;AccountKey=abc;EndpointSuffix=core.windows.net";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_i_with_grave_in_account_name_with_endpoint_suffix_yields_no_blob_host()
    {
        const string value = "AccountName=valid\u00ECname;AccountKey=abc;EndpointSuffix=core.windows.net";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_i_with_acute_in_account_name_with_endpoint_suffix_yields_no_blob_host()
    {
        const string value = "AccountName=valid\u00EDname;AccountKey=abc;EndpointSuffix=core.windows.net";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_i_with_circumflex_in_account_name_with_endpoint_suffix_yields_no_blob_host()
    {
        const string value = "AccountName=valid\u00EEname;AccountKey=abc;EndpointSuffix=core.windows.net";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_o_with_circumflex_in_account_name_with_endpoint_suffix_yields_no_blob_host()
    {
        const string value = "AccountName=valid\u00F4name;AccountKey=abc;EndpointSuffix=core.windows.net";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_u_with_grave_in_account_name_with_endpoint_suffix_yields_no_blob_host()
    {
        const string value = "AccountName=valid\u00F9name;AccountKey=abc;EndpointSuffix=core.windows.net";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_u_with_acute_in_account_name_with_endpoint_suffix_yields_no_blob_host()
    {
        const string value = "AccountName=valid\u00FAname;AccountKey=abc;EndpointSuffix=core.windows.net";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_u_with_circumflex_in_account_name_with_endpoint_suffix_yields_no_blob_host()
    {
        const string value = "AccountName=valid\u00FBname;AccountKey=abc;EndpointSuffix=core.windows.net";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_a_with_grave_in_account_name_with_endpoint_suffix_yields_no_blob_host()
    {
        const string value = "AccountName=valid\u00E0name;AccountKey=abc;EndpointSuffix=core.windows.net";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_a_with_acute_in_account_name_with_endpoint_suffix_yields_no_blob_host()
    {
        const string value = "AccountName=valid\u00E1name;AccountKey=abc;EndpointSuffix=core.windows.net";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_a_with_tilde_in_account_name_with_endpoint_suffix_yields_no_blob_host()
    {
        const string value = "AccountName=valid\u00E3name;AccountKey=abc;EndpointSuffix=core.windows.net";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_e_with_grave_in_account_name_with_endpoint_suffix_yields_no_blob_host()
    {
        const string value = "AccountName=valid\u00E8name;AccountKey=abc;EndpointSuffix=core.windows.net";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_e_with_circumflex_in_account_name_with_endpoint_suffix_yields_no_blob_host()
    {
        const string value = "AccountName=valid\u00EAname;AccountKey=abc;EndpointSuffix=core.windows.net";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_o_with_grave_in_account_name_with_endpoint_suffix_yields_no_blob_host()
    {
        const string value = "AccountName=valid\u00F2name;AccountKey=abc;EndpointSuffix=core.windows.net";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_o_with_acute_in_account_name_with_endpoint_suffix_yields_no_blob_host()
    {
        const string value = "AccountName=valid\u00F3name;AccountKey=abc;EndpointSuffix=core.windows.net";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_o_with_tilde_in_account_name_with_endpoint_suffix_yields_no_blob_host()
    {
        const string value = "AccountName=valid\u00F5name;AccountKey=abc;EndpointSuffix=core.windows.net";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_u_with_tilde_in_account_name_with_endpoint_suffix_yields_no_blob_host()
    {
        const string value = "AccountName=valid\u0169name;AccountKey=abc;EndpointSuffix=core.windows.net";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_u_with_ring_in_account_name_with_endpoint_suffix_yields_no_blob_host()
    {
        const string value = "AccountName=valid\u016Fname;AccountKey=abc;EndpointSuffix=core.windows.net";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_u_with_breve_in_account_name_with_endpoint_suffix_yields_no_blob_host()
    {
        const string value = "AccountName=valid\u016Dname;AccountKey=abc;EndpointSuffix=core.windows.net";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_u_with_ogonek_in_account_name_with_endpoint_suffix_yields_no_blob_host()
    {
        const string value = "AccountName=valid\u0173name;AccountKey=abc;EndpointSuffix=core.windows.net";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_u_with_macron_in_account_name_with_endpoint_suffix_yields_no_blob_host()
    {
        const string value = "AccountName=valid\u016Aname;AccountKey=abc;EndpointSuffix=core.windows.net";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_u_with_double_acute_in_account_name_with_endpoint_suffix_yields_no_blob_host()
    {
        const string value = "AccountName=valid\u0171name;AccountKey=abc;EndpointSuffix=core.windows.net";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_u_with_dot_below_in_account_name_with_endpoint_suffix_yields_no_blob_host()
    {
        const string value = "AccountName=valid\u0175name;AccountKey=abc;EndpointSuffix=core.windows.net";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_u_with_inverted_breve_in_account_name_with_endpoint_suffix_yields_no_blob_host()
    {
        const string value = "AccountName=valid\u0177name;AccountKey=abc;EndpointSuffix=core.windows.net";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_u_with_horn_in_account_name_with_endpoint_suffix_yields_no_blob_host()
    {
        const string value = "AccountName=valid\u01B0name;AccountKey=abc;EndpointSuffix=core.windows.net";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_w_with_grave_in_account_name_with_endpoint_suffix_yields_no_blob_host()
    {
        const string value = "AccountName=valid\u1E81name;AccountKey=abc;EndpointSuffix=core.windows.net";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_w_with_acute_in_account_name_with_endpoint_suffix_yields_no_blob_host()
    {
        const string value = "AccountName=valid\u1E83name;AccountKey=abc;EndpointSuffix=core.windows.net";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_w_with_circumflex_in_account_name_with_endpoint_suffix_yields_no_blob_host()
    {
        const string value = "AccountName=valid\u1E85name;AccountKey=abc;EndpointSuffix=core.windows.net";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_w_with_diaeresis_in_account_name_with_endpoint_suffix_yields_no_blob_host()
    {
        const string value = "AccountName=valid\u1E87name;AccountKey=abc;EndpointSuffix=core.windows.net";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_w_with_dot_above_in_account_name_with_endpoint_suffix_yields_no_blob_host()
    {
        const string value = "AccountName=valid\u1E89name;AccountKey=abc;EndpointSuffix=core.windows.net";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_w_with_ring_above_in_account_name_with_endpoint_suffix_yields_no_blob_host()
    {
        const string value = "AccountName=valid\u1E8Bname;AccountKey=abc;EndpointSuffix=core.windows.net";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_w_with_double_grave_in_account_name_with_endpoint_suffix_yields_no_blob_host()
    {
        const string value = "AccountName=valid\u1E91name;AccountKey=abc;EndpointSuffix=core.windows.net";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_w_with_ogonek_in_account_name_with_endpoint_suffix_yields_no_blob_host()
    {
        const string value = "AccountName=valid\u1E8Dname;AccountKey=abc;EndpointSuffix=core.windows.net";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_w_with_macron_in_account_name_with_endpoint_suffix_yields_no_blob_host()
    {
        const string value = "AccountName=valid\u1E8Fname;AccountKey=abc;EndpointSuffix=core.windows.net";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_w_with_caron_in_account_name_with_endpoint_suffix_yields_no_blob_host()
    {
        const string value = "AccountName=valid\u1E85name;AccountKey=abc;EndpointSuffix=core.windows.net";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_w_with_breve_in_account_name_with_endpoint_suffix_yields_no_blob_host()
    {
        const string value = "AccountName=valid\u1E81name;AccountKey=abc;EndpointSuffix=core.windows.net";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_w_with_hook_above_in_account_name_with_endpoint_suffix_yields_no_blob_host()
    {
        const string value = "AccountName=valid\u1E82name;AccountKey=abc;EndpointSuffix=core.windows.net";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_w_with_tilde_in_account_name_with_endpoint_suffix_yields_no_blob_host()
    {
        const string value = "AccountName=valid\u1E83name;AccountKey=abc;EndpointSuffix=core.windows.net";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_w_with_line_below_in_account_name_with_endpoint_suffix_yields_no_blob_host()
    {
        const string value = "AccountName=valid\u1E8Ename;AccountKey=abc;EndpointSuffix=core.windows.net";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_w_with_circumflex_accent_in_account_name_with_endpoint_suffix_yields_no_blob_host()
    {
        const string value = "AccountName=valid\u1E8Cname;AccountKey=abc;EndpointSuffix=core.windows.net";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_w_with_inverted_breve_in_account_name_with_endpoint_suffix_yields_no_blob_host()
    {
        const string value = "AccountName=valid\u1E93name;AccountKey=abc;EndpointSuffix=core.windows.net";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_w_with_double_acute_in_account_name_with_endpoint_suffix_yields_no_blob_host()
    {
        const string value = "AccountName=valid\u1E85name;AccountKey=abc;EndpointSuffix=core.windows.net";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_w_with_dot_below_in_account_name_with_endpoint_suffix_yields_no_blob_host()
    {
        const string value = "AccountName=valid\u1E67name;AccountKey=abc;EndpointSuffix=core.windows.net";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_w_with_ring_below_in_account_name_with_endpoint_suffix_yields_no_blob_host()
    {
        const string value = "AccountName=valid\u1E98name;AccountKey=abc;EndpointSuffix=core.windows.net";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_w_with_line_through_in_account_name_with_endpoint_suffix_yields_no_blob_host()
    {
        const string value = "AccountName=valid\u1E5Fname;AccountKey=abc;EndpointSuffix=core.windows.net";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_w_with_cedilla_in_account_name_with_endpoint_suffix_yields_no_blob_host()
    {
        const string value = "AccountName=valid\u1E89name;AccountKey=abc;EndpointSuffix=core.windows.net";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_w_with_circumflex_below_in_account_name_with_endpoint_suffix_yields_no_blob_host()
    {
        const string value = "AccountName=valid\u1E33name;AccountKey=abc;EndpointSuffix=core.windows.net";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_w_with_turned_comma_in_account_name_with_endpoint_suffix_yields_no_blob_host()
    {
        const string value = "AccountName=valid\u1E2Fname;AccountKey=abc;EndpointSuffix=core.windows.net";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_w_with_acute_below_in_account_name_with_endpoint_suffix_yields_no_blob_host()
    {
        const string value = "AccountName=valid\u1E31name;AccountKey=abc;EndpointSuffix=core.windows.net";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_w_with_grave_below_in_account_name_with_endpoint_suffix_yields_no_blob_host()
    {
        const string value = "AccountName=valid\u1E49name;AccountKey=abc;EndpointSuffix=core.windows.net";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_w_with_tilde_below_in_account_name_with_endpoint_suffix_yields_no_blob_host()
    {
        const string value = "AccountName=valid\u1E6Dname;AccountKey=abc;EndpointSuffix=core.windows.net";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_w_with_ring_above_u1E61_in_account_name_with_endpoint_suffix_yields_no_blob_host()
    {
        const string value = "AccountName=valid\u1E61name;AccountKey=abc;EndpointSuffix=core.windows.net";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_w_with_dot_above_u1E23_in_account_name_with_endpoint_suffix_yields_no_blob_host()
    {
        const string value = "AccountName=valid\u1E23name;AccountKey=abc;EndpointSuffix=core.windows.net";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_w_with_tilde_u1E7F_in_account_name_with_endpoint_suffix_yields_no_blob_host()
    {
        const string value = "AccountName=valid\u1E7Fname;AccountKey=abc;EndpointSuffix=core.windows.net";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_w_with_hook_below_in_account_name_with_endpoint_suffix_yields_no_blob_host()
    {
        const string value = "AccountName=valid\u1E99name;AccountKey=abc;EndpointSuffix=core.windows.net";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_w_with_long_leg_in_account_name_with_endpoint_suffix_yields_no_blob_host()
    {
        const string value = "AccountName=valid\u1E9Fname;AccountKey=abc;EndpointSuffix=core.windows.net";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_w_with_palatal_hook_in_account_name_with_endpoint_suffix_yields_no_blob_host()
    {
        const string value = "AccountName=valid\u1E9Cname;AccountKey=abc;EndpointSuffix=core.windows.net";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_w_with_retroflex_hook_in_account_name_with_endpoint_suffix_yields_no_blob_host()
    {
        const string value = "AccountName=valid\u1E9Dname;AccountKey=abc;EndpointSuffix=core.windows.net";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_w_with_curl_u1E9B_in_account_name_with_endpoint_suffix_yields_no_blob_host()
    {
        const string value = "AccountName=valid\u1E9Bname;AccountKey=abc;EndpointSuffix=core.windows.net";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_w_with_dot_below_u1EA0_in_account_name_with_endpoint_suffix_yields_no_blob_host()
    {
        const string value = "AccountName=valid\u1EA0name;AccountKey=abc;EndpointSuffix=core.windows.net";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_w_with_dot_above_u1EA1_in_account_name_with_endpoint_suffix_yields_no_blob_host()
    {
        const string value = "AccountName=valid\u1EA1name;AccountKey=abc;EndpointSuffix=core.windows.net";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_u1EA3_in_account_name_with_endpoint_suffix_yields_no_blob_host()
    {
        const string value = "AccountName=valid\u1EA3name;AccountKey=abc;EndpointSuffix=core.windows.net";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_u1EA4_in_account_name_with_endpoint_suffix_yields_no_blob_host()
    {
        const string value = "AccountName=valid\u1EA4name;AccountKey=abc;EndpointSuffix=core.windows.net";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_u1EA5_in_account_name_with_endpoint_suffix_yields_no_blob_host()
    {
        const string value = "AccountName=valid\u1EA5name;AccountKey=abc;EndpointSuffix=core.windows.net";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_u1EA6_in_account_name_with_endpoint_suffix_yields_no_blob_host()
    {
        const string value = "AccountName=valid\u1EA6name;AccountKey=abc;EndpointSuffix=core.windows.net";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_u1EA7_in_account_name_with_endpoint_suffix_yields_no_blob_host()
    {
        const string value = "AccountName=valid\u1EA7name;AccountKey=abc;EndpointSuffix=core.windows.net";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_u1EA8_in_account_name_with_endpoint_suffix_yields_no_blob_host()
    {
        const string value = "AccountName=valid\u1EA8name;AccountKey=abc;EndpointSuffix=core.windows.net";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_u1EA9_in_account_name_with_endpoint_suffix_yields_no_blob_host()
    {
        const string value = "AccountName=valid\u1EA9name;AccountKey=abc;EndpointSuffix=core.windows.net";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_u1EAA_in_account_name_with_endpoint_suffix_yields_no_blob_host()
    {
        const string value = "AccountName=valid\u1EAAname;AccountKey=abc;EndpointSuffix=core.windows.net";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_u1EAB_in_account_name_with_endpoint_suffix_yields_no_blob_host()
    {
        const string value = "AccountName=valid\u1EABname;AccountKey=abc;EndpointSuffix=core.windows.net";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_u1EAC_in_account_name_with_endpoint_suffix_yields_no_blob_host()
    {
        const string value = "AccountName=valid\u1EACname;AccountKey=abc;EndpointSuffix=core.windows.net";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_u1EAD_in_account_name_with_endpoint_suffix_yields_no_blob_host()
    {
        const string value = "AccountName=valid\u1EADname;AccountKey=abc;EndpointSuffix=core.windows.net";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_u1EAE_in_account_name_with_endpoint_suffix_yields_no_blob_host()
    {
        const string value = "AccountName=valid\u1EAEname;AccountKey=abc;EndpointSuffix=core.windows.net";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_u1EAF_in_account_name_with_endpoint_suffix_yields_no_blob_host()
    {
        const string value = "AccountName=valid\u1EAFname;AccountKey=abc;EndpointSuffix=core.windows.net";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_u1EB0_in_account_name_with_endpoint_suffix_yields_no_blob_host()
    {
        const string value = "AccountName=valid\u1EB0name;AccountKey=abc;EndpointSuffix=core.windows.net";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_u1EB1_in_account_name_with_endpoint_suffix_yields_no_blob_host()
    {
        const string value = "AccountName=valid\u1EB1name;AccountKey=abc;EndpointSuffix=core.windows.net";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_u1EB2_in_account_name_with_endpoint_suffix_yields_no_blob_host()
    {
        const string value = "AccountName=valid\u1EB2name;AccountKey=abc;EndpointSuffix=core.windows.net";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_u1EB3_in_account_name_with_endpoint_suffix_yields_no_blob_host()
    {
        const string value = "AccountName=valid\u1EB3name;AccountKey=abc;EndpointSuffix=core.windows.net";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_u1EB4_in_account_name_with_endpoint_suffix_yields_no_blob_host()
    {
        const string value = "AccountName=valid\u1EB4name;AccountKey=abc;EndpointSuffix=core.windows.net";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_u1EB5_in_account_name_with_endpoint_suffix_yields_no_blob_host()
    {
        const string value = "AccountName=valid\u1EB5name;AccountKey=abc;EndpointSuffix=core.windows.net";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_u1EB6_in_account_name_with_endpoint_suffix_yields_no_blob_host()
    {
        const string value = "AccountName=valid\u1EB6name;AccountKey=abc;EndpointSuffix=core.windows.net";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_u1EB7_in_account_name_with_endpoint_suffix_yields_no_blob_host()
    {
        const string value = "AccountName=valid\u1EB7name;AccountKey=abc;EndpointSuffix=core.windows.net";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_u1EB8_in_account_name_with_endpoint_suffix_yields_no_blob_host()
    {
        const string value = "AccountName=valid\u1EB8name;AccountKey=abc;EndpointSuffix=core.windows.net";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_u1EB9_in_account_name_with_endpoint_suffix_yields_no_blob_host()
    {
        const string value = "AccountName=valid\u1EB9name;AccountKey=abc;EndpointSuffix=core.windows.net";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_u1EBA_in_account_name_with_endpoint_suffix_yields_no_blob_host()
    {
        const string value = "AccountName=valid\u1EBAname;AccountKey=abc;EndpointSuffix=core.windows.net";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_u1EBB_in_account_name_with_endpoint_suffix_yields_no_blob_host()
    {
        const string value = "AccountName=valid\u1EBBname;AccountKey=abc;EndpointSuffix=core.windows.net";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_u1EBC_in_account_name_with_endpoint_suffix_yields_no_blob_host()
    {
        const string value = "AccountName=valid\u1EBCname;AccountKey=abc;EndpointSuffix=core.windows.net";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_u1EBD_in_account_name_with_endpoint_suffix_yields_no_blob_host()
    {
        const string value = "AccountName=valid\u1EBDname;AccountKey=abc;EndpointSuffix=core.windows.net";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_u1EBE_in_account_name_with_endpoint_suffix_yields_no_blob_host()
    {
        const string value = "AccountName=valid\u1EBEname;AccountKey=abc;EndpointSuffix=core.windows.net";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_u1EBF_in_account_name_with_endpoint_suffix_yields_no_blob_host()
    {
        const string value = "AccountName=valid\u1EBFname;AccountKey=abc;EndpointSuffix=core.windows.net";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_u1EC0_in_account_name_with_endpoint_suffix_yields_no_blob_host()
    {
        const string value = "AccountName=valid\u1EC0name;AccountKey=abc;EndpointSuffix=core.windows.net";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_u1EC1_in_account_name_with_endpoint_suffix_yields_no_blob_host()
    {
        const string value = "AccountName=valid\u1EC1name;AccountKey=abc;EndpointSuffix=core.windows.net";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_u1EC2_in_account_name_with_endpoint_suffix_yields_no_blob_host()
    {
        const string value = "AccountName=valid\u1EC2name;AccountKey=abc;EndpointSuffix=core.windows.net";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_u1EC3_in_account_name_with_endpoint_suffix_yields_no_blob_host()
    {
        const string value = "AccountName=valid\u1EC3name;AccountKey=abc;EndpointSuffix=core.windows.net";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_u1EC4_in_account_name_with_endpoint_suffix_yields_no_blob_host()
    {
        const string value = "AccountName=valid\u1EC4name;AccountKey=abc;EndpointSuffix=core.windows.net";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_u1EC5_in_account_name_with_endpoint_suffix_yields_no_blob_host()
    {
        const string value = "AccountName=valid\u1EC5name;AccountKey=abc;EndpointSuffix=core.windows.net";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_u1EC6_in_account_name_with_endpoint_suffix_yields_no_blob_host()
    {
        const string value = "AccountName=valid\u1EC6name;AccountKey=abc;EndpointSuffix=core.windows.net";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_u1EC7_in_account_name_with_endpoint_suffix_yields_no_blob_host()
    {
        const string value = "AccountName=valid\u1EC7name;AccountKey=abc;EndpointSuffix=core.windows.net";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_u1EC8_in_account_name_with_endpoint_suffix_yields_no_blob_host()
    {
        const string value = "AccountName=valid\u1EC8name;AccountKey=abc;EndpointSuffix=core.windows.net";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_u1EC9_in_account_name_with_endpoint_suffix_yields_no_blob_host()
    {
        const string value = "AccountName=valid\u1EC9name;AccountKey=abc;EndpointSuffix=core.windows.net";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }

    [Fact]
    public void ParseSettingValues_o_with_stroke_in_account_name_with_endpoint_suffix_yields_no_blob_host()
    {
        const string value = "AccountName=valid\u00F8name;AccountKey=abc;EndpointSuffix=core.windows.net";

        IReadOnlyList<AzureInventoryAppSettingHostParsedFields> parsed =
            AzureInventoryAppSettingHostRedactor.ParseSettingValues(value);

        parsed.Should().BeEmpty();
    }
}
