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
    public void TryExtractHost_reads_host_when_scheme_less_webhook_url_percent_encodes_path_segment()
    {
        AzureInventoryEventGridWebhookHostExtractor.TryExtractHost("hooks.example.com%2Fcallback?token=x")
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

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("not-a-uri")]
    public void TryExtractHost_returns_null_for_invalid_input(string? endpointUrl)
    {
        AzureInventoryEventGridWebhookHostExtractor.TryExtractHost(endpointUrl).Should().BeNull();
    }
}
