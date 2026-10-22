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

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("not-a-uri")]
    public void TryExtractHost_returns_null_for_invalid_input(string? endpointUrl)
    {
        AzureInventoryEventGridWebhookHostExtractor.TryExtractHost(endpointUrl).Should().BeNull();
    }
}
