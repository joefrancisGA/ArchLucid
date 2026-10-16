using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Manifest;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Manifest;

[Trait("Category", "Unit")]
public sealed class ManifestServiceDeserializationTests
{
    [Fact]
    public void Deserialize_null_collection_properties_yields_empty_lists_not_null()
    {
        const string json = """
            {
              "serviceId": "svc-1",
              "serviceName": "api",
              "serviceType": 0,
              "runtimePlatform": 0,
              "tags": null,
              "requiredControls": null
            }
            """;

        ManifestService service = JsonSerializer.Deserialize<ManifestService>(json, ContractJson.Default)!;

        service.Tags.Should().NotBeNull().And.BeEmpty();
        service.RequiredControls.Should().NotBeNull().And.BeEmpty();
    }
}
