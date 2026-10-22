using System.Text.Json;

using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Agents;

[Trait("Category", "Unit")]
public sealed class ServiceCatalogEvidenceDeserializationTests
{
    [Fact]
    public void Deserialize_null_collection_properties_yields_empty_lists_not_null()
    {
        const string json = """
            {
              "serviceId": "svc-1",
              "serviceName": "name",
              "category": "cat",
              "summary": "summary",
              "tags": null,
              "recommendedUseCases": null
            }
            """;

        ServiceCatalogEvidence evidence = JsonSerializer.Deserialize<ServiceCatalogEvidence>(json, ContractJson.Default)!;

        evidence.Tags.Should().NotBeNull().And.BeEmpty();
        evidence.RecommendedUseCases.Should().NotBeNull().And.BeEmpty();
    }
}
