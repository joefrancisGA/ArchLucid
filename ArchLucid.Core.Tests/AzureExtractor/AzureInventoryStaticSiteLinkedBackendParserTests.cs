using System.Text.Json;

using ArchLucid.Core.AzureExtractor;
using ArchLucid.Core.InfraEvidence;

using FluentAssertions;

namespace ArchLucid.Core.Tests.AzureExtractor;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class AzureInventoryStaticSiteLinkedBackendParserTests
{
    [Fact]
    public void TryReadBackendResourceId_reads_properties_resourceId()
    {
        using JsonDocument document = JsonDocument.Parse(
            """
            {
              "properties": {
                "resourceId": "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Web/sites/api1"
              }
            }
            """);

        string? backendId = AzureInventoryStaticSiteLinkedBackendParser.TryReadBackendResourceId(
            document.RootElement);

        backendId.Should().Be(
            ArmResourceIdNormalizer.Normalize(
                "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Web/sites/api1"));
    }

    [Fact]
    public void TryReadBackendResourceId_reads_backendResourceId_fallback()
    {
        using JsonDocument document = JsonDocument.Parse(
            """
            {
              "properties": {
                "backendResourceId": "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Web/sites/fn1"
              }
            }
            """);

        string? backendId = AzureInventoryStaticSiteLinkedBackendParser.TryReadBackendResourceId(
            document.RootElement);

        backendId.Should().Be(
            ArmResourceIdNormalizer.Normalize(
                "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Web/sites/fn1"));
    }
}
