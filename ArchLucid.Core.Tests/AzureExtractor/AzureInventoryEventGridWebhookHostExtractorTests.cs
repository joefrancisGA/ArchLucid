using ArchLucid.Core.AzureExtractor;

using FluentAssertions;

namespace ArchLucid.Core.Tests.AzureExtractor;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class AzureInventoryEventGridWebhookHostExtractorTests
{
    [Theory]
    [InlineData("https://prod-01.westus.logic.azure.com:443/workflows/abc/triggers/manual/paths/invoke?api-version=2016-10-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=secret", "prod-01.westus.logic.azure.com")]
    [InlineData("HTTPS://MYAPP.AZUREWEBSITES.NET/api/hook", "myapp.azurewebsites.net")]
    public void TryExtractHost_returns_lowercase_host_without_path_or_query(string endpointUrl, string expectedHost)
    {
        AzureInventoryEventGridWebhookHostExtractor.TryExtractHost(endpointUrl)
            .Should()
            .Be(expectedHost);
    }

    [Fact]
    public void TryExtractHost_strips_userinfo_from_webhook_url()
    {
        AzureInventoryEventGridWebhookHostExtractor.TryExtractHost("https://user:pass@hooks.example.com/path")
            .Should()
            .Be("hooks.example.com");
    }

    [Fact]
    public void TryExtractHost_strips_trailing_dot_from_hostname()
    {
        AzureInventoryEventGridWebhookHostExtractor.TryExtractHost("https://hooks.example.com./path")
            .Should()
            .Be("hooks.example.com");
    }

    [Fact]
    public void TryExtractHost_reads_host_when_webhook_url_uses_uppercase_http_scheme()
    {
        AzureInventoryEventGridWebhookHostExtractor.TryExtractHost("HTTP://hooks.example.com/path")
            .Should()
            .Be("hooks.example.com");
    }

    [Fact]
    public void TryExtractHost_reads_host_when_webhook_url_omits_scheme()
    {
        AzureInventoryEventGridWebhookHostExtractor.TryExtractHost("hooks.example.com/callback?token=x")
            .Should()
            .Be("hooks.example.com");
    }

    [Fact]
    public void TryExtractHost_reads_host_when_scheme_less_webhook_url_percent_encodes_userinfo_prefix()
    {
        AzureInventoryEventGridWebhookHostExtractor.TryExtractHost("user%40hooks.example.com%2Fpath")
            .Should()
            .Be("hooks.example.com");
    }

    [Fact]
    public void TryExtractHost_reads_host_when_scheme_less_webhook_url_percent_encodes_path_segment()
    {
        AzureInventoryEventGridWebhookHostExtractor.TryExtractHost("hooks.example.com%2Fcallback?token=x")
            .Should()
            .Be("hooks.example.com");
    }

    [Fact]
    public void TryExtractHost_reads_host_when_scheme_less_webhook_url_triply_percent_encodes_path_segment()
    {
        AzureInventoryEventGridWebhookHostExtractor.TryExtractHost("hooks.example.com%25252Fcallback?token=x")
            .Should()
            .Be("hooks.example.com");
    }

    [Fact]
    public void TryExtractHost_strips_userinfo_when_endpoint_url_is_percent_encoded_https_with_user()
    {
        string encoded = Uri.EscapeDataString("https://user@hooks.example.com/path");

        AzureInventoryEventGridWebhookHostExtractor.TryExtractHost(encoded)
            .Should()
            .Be("hooks.example.com");
    }

    [Fact]
    public void TryExtractHost_reads_host_when_scheme_less_webhook_url_doubly_percent_encodes_path_segment()
    {
        AzureInventoryEventGridWebhookHostExtractor.TryExtractHost("hooks.example.com%252Fcallback?token=x")
            .Should()
            .Be("hooks.example.com");
    }

    [Fact]
    public void TryExtractHost_reads_host_when_scheme_less_webhook_url_includes_userinfo()
    {
        AzureInventoryEventGridWebhookHostExtractor.TryExtractHost("user@hooks.example.com/callback?token=x")
            .Should()
            .Be("hooks.example.com");
    }

    [Fact]
    public void TryExtractHost_reads_host_when_webhook_url_is_protocol_relative()
    {
        AzureInventoryEventGridWebhookHostExtractor.TryExtractHost("//hooks.example.com/callback?token=x")
            .Should()
            .Be("hooks.example.com");
    }

    [Fact]
    public void TryExtractHost_reads_host_when_scheme_less_unbracketed_global_ipv6_has_path_without_port()
    {
        AzureInventoryEventGridWebhookHostExtractor.TryExtractHost("2001:db8::1/callback")
            .Should()
            .Be("2001:db8::1");
    }

    [Fact]
    public void TryExtractHost_reads_host_when_scheme_less_unbracketed_link_local_ipv6_has_explicit_port_and_path()
    {
        AzureInventoryEventGridWebhookHostExtractor.TryExtractHost("fe80::1:443/callback")
            .Should()
            .Be("fe80::1");
    }

    [Fact]
    public void TryExtractHost_reads_host_when_scheme_less_webhook_url_percent_encodes_link_local_ipv6_with_port()
    {
        AzureInventoryEventGridWebhookHostExtractor.TryExtractHost("fe80%3A%3A1%3A443/callback")
            .Should()
            .Be("fe80::1");
    }

    [Fact]
    public void TryExtractHost_reads_host_when_scheme_less_webhook_url_percent_encodes_userinfo_before_callback_path()
    {
        AzureInventoryEventGridWebhookHostExtractor.TryExtractHost("user%40hooks.example.com/callback")
            .Should()
            .Be("hooks.example.com");
    }

    [Fact]
    public void TryExtractHost_reads_host_when_full_https_webhook_url_percent_encodes_unbracketed_ipv6_trailing_dot_before_port()
    {
        AzureInventoryEventGridWebhookHostExtractor.TryExtractHost("https://2001%3Adb8%3A%3A1.%2E%3A443/callback")
            .Should()
            .Be("2001:db8::1");
    }

    [Fact]
    public void TryExtractHost_reads_host_when_full_https_webhook_url_percent_encodes_bracketed_ipv6_trailing_dot_before_port()
    {
        AzureInventoryEventGridWebhookHostExtractor.TryExtractHost("https://%5B2001%3Adb8%3A%3A1%5D.%2E%3A443/callback")
            .Should()
            .Be("2001:db8::1");
    }

    [Fact]
    public void TryExtractHost_reads_host_when_full_https_webhook_url_percent_encodes_bracketed_ipv6_authority_and_port()
    {
        AzureInventoryEventGridWebhookHostExtractor.TryExtractHost("https://%5B2001%3Adb8%3A%3A1%5D%3A443/callback")
            .Should()
            .Be("2001:db8::1");
    }

    [Fact]
    public void TryExtractHost_reads_host_when_full_https_webhook_url_percent_encodes_trailing_dot_before_explicit_port_8443()
    {
        AzureInventoryEventGridWebhookHostExtractor.TryExtractHost("https://hooks.example.com.%2E%3A8443/callback")
            .Should()
            .Be("hooks.example.com");
    }

    [Fact]
    public void TryExtractHost_reads_host_when_full_https_webhook_url_percent_encodes_trailing_dot_before_non_standard_port()
    {
        AzureInventoryEventGridWebhookHostExtractor.TryExtractHost("https://hooks.example.com.%2E%3A10443/callback")
            .Should()
            .Be("hooks.example.com");
    }

    [Fact]
    public void TryExtractHost_reads_host_when_full_http_webhook_url_percent_encodes_trailing_dot_before_non_standard_port()
    {
        AzureInventoryEventGridWebhookHostExtractor.TryExtractHost("http://hooks.example.com.%2E%3A10443/callback")
            .Should()
            .Be("hooks.example.com");
    }

    [Fact]
    public void TryExtractHost_reads_host_when_full_https_webhook_url_percent_encodes_trailing_dot_and_port()
    {
        AzureInventoryEventGridWebhookHostExtractor.TryExtractHost("https://hooks.example.com.%2E%3A443/callback")
            .Should()
            .Be("hooks.example.com");
    }

    [Fact]
    public void TryExtractHost_reads_host_when_scheme_less_webhook_url_percent_encodes_trailing_dot_before_non_standard_port()
    {
        AzureInventoryEventGridWebhookHostExtractor.TryExtractHost("hooks.example.com.%2E%3A10443/callback")
            .Should()
            .Be("hooks.example.com");
    }

    [Fact]
    public void TryExtractHost_reads_host_when_scheme_less_webhook_url_percent_encodes_trailing_dot_before_explicit_port()
    {
        AzureInventoryEventGridWebhookHostExtractor.TryExtractHost("hooks.example.com.%2E%3A8443/callback")
            .Should()
            .Be("hooks.example.com");
    }

    [Fact]
    public void TryExtractHost_reads_host_when_scheme_less_webhook_url_percent_encodes_trailing_dot_before_path()
    {
        AzureInventoryEventGridWebhookHostExtractor.TryExtractHost("hooks.example.com.%2E/callback")
            .Should()
            .Be("hooks.example.com");
    }

    [Fact]
    public void TryExtractHost_reads_host_when_full_https_webhook_url_percent_encodes_trailing_dot_on_hostname()
    {
        string encodedUrl = Uri.EscapeDataString("https://hooks.example.com./callback");

        AzureInventoryEventGridWebhookHostExtractor.TryExtractHost(encodedUrl)
            .Should()
            .Be("hooks.example.com");
    }

    [Fact]
    public void TryExtractHost_reads_host_when_full_https_webhook_url_is_percent_encoded_with_userinfo()
    {
        string encoded = Uri.EscapeDataString("https://user@hooks.example.com/path");

        AzureInventoryEventGridWebhookHostExtractor.TryExtractHost(encoded)
            .Should()
            .Be("hooks.example.com");
    }

    [Fact]
    public void TryExtractHost_reads_host_when_scheme_less_unbracketed_ipv6_literal_has_explicit_port_and_path()
    {
        AzureInventoryEventGridWebhookHostExtractor.TryExtractHost("2001:db8::1:443/callback")
            .Should()
            .Be("2001:db8::1");
    }

    [Fact]
    public void TryExtractHost_reads_host_when_scheme_less_unbracketed_ipv6_literal_has_path_without_port()
    {
        AzureInventoryEventGridWebhookHostExtractor.TryExtractHost("2001:db8::1/callback")
            .Should()
            .Be("2001:db8::1");
    }

    [Fact]
    public void TryExtractHost_reads_host_when_scheme_less_webhook_url_percent_encodes_unbracketed_ipv6_literal_port_suffix()
    {
        AzureInventoryEventGridWebhookHostExtractor.TryExtractHost("2001:db8::1%3A443/callback")
            .Should()
            .Be("2001:db8::1");
    }

    [Fact]
    public void TryExtractHost_reads_host_when_scheme_less_webhook_url_percent_encodes_unbracketed_ipv6_trailing_dot_before_port()
    {
        AzureInventoryEventGridWebhookHostExtractor.TryExtractHost("2001%3Adb8%3A%3A1.%2E%3A443/callback")
            .Should()
            .Be("2001:db8::1");
    }

    [Fact]
    public void TryExtractHost_reads_host_when_scheme_less_webhook_url_percent_encodes_unbracketed_ipv6_trailing_dot_before_non_standard_port()
    {
        AzureInventoryEventGridWebhookHostExtractor.TryExtractHost("2001%3Adb8%3A%3A1.%2E%3A10443/callback")
            .Should()
            .Be("2001:db8::1");
    }

    [Fact]
    public void TryExtractHost_reads_host_when_full_http_webhook_url_percent_encodes_unbracketed_ipv6_trailing_dot_before_non_standard_port()
    {
        AzureInventoryEventGridWebhookHostExtractor.TryExtractHost("http://2001%3Adb8%3A%3A1.%2E%3A10443/callback")
            .Should()
            .Be("2001:db8::1");
    }

    [Fact]
    public void TryExtractHost_reads_host_when_full_https_webhook_url_percent_encodes_unbracketed_ipv6_trailing_dot_before_non_standard_port()
    {
        AzureInventoryEventGridWebhookHostExtractor.TryExtractHost("https://2001%3Adb8%3A%3A1.%2E%3A10443/callback")
            .Should()
            .Be("2001:db8::1");
    }

    [Fact]
    public void TryExtractHost_reads_host_when_scheme_less_webhook_url_percent_encodes_bracketed_ipv6_trailing_dot_before_port()
    {
        AzureInventoryEventGridWebhookHostExtractor.TryExtractHost("%5B2001%3Adb8%3A%3A1%5D.%2E%3A443/callback")
            .Should()
            .Be("2001:db8::1");
    }

    [Fact]
    public void TryExtractHost_reads_host_when_scheme_less_webhook_url_percent_encodes_bracketed_ipv6_trailing_dot_before_non_standard_port()
    {
        AzureInventoryEventGridWebhookHostExtractor.TryExtractHost("%5B2001%3Adb8%3A%3A1%5D.%2E%3A10443/callback")
            .Should()
            .Be("2001:db8::1");
    }

    [Fact]
    public void TryExtractHost_reads_host_when_full_http_webhook_url_percent_encodes_bracketed_ipv6_trailing_dot_before_non_standard_port()
    {
        AzureInventoryEventGridWebhookHostExtractor.TryExtractHost("http://%5B2001%3Adb8%3A%3A1%5D.%2E%3A10443/callback")
            .Should()
            .Be("2001:db8::1");
    }

    [Fact]
    public void TryExtractHost_reads_host_when_full_https_webhook_url_percent_encodes_bracketed_ipv6_trailing_dot_before_non_standard_port()
    {
        AzureInventoryEventGridWebhookHostExtractor.TryExtractHost("https://%5B2001%3Adb8%3A%3A1%5D.%2E%3A10443/callback")
            .Should()
            .Be("2001:db8::1");
    }

    [Fact]
    public void TryExtractHost_reads_host_when_scheme_less_webhook_url_percent_encodes_bracketed_ipv6_authority_and_port()
    {
        AzureInventoryEventGridWebhookHostExtractor.TryExtractHost("%5B2001%3Adb8%3A%3A1%5D%3A443/callback")
            .Should()
            .Be("2001:db8::1");
    }

    [Fact]
    public void TryExtractHost_reads_host_when_scheme_less_webhook_url_percent_encodes_ipv6_literal_port_suffix()
    {
        AzureInventoryEventGridWebhookHostExtractor.TryExtractHost("[2001:db8::1]%3A443/callback")
            .Should()
            .Be("2001:db8::1");
    }

    [Fact]
    public void TryExtractHost_reads_host_when_scheme_less_webhook_url_percent_encodes_port_suffix()
    {
        AzureInventoryEventGridWebhookHostExtractor.TryExtractHost("hooks.example.com%3A443/callback")
            .Should()
            .Be("hooks.example.com");
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("not-a-uri")]
    public void TryExtractHost_returns_null_for_invalid_input(string? endpointUrl)
    {
        AzureInventoryEventGridWebhookHostExtractor.TryExtractHost(endpointUrl).Should().BeNull();
    }
}
