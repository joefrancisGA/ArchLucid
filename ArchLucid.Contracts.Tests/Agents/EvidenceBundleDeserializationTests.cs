using System.Text.Json;

using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Agents;

[Trait("Category", "Unit")]
public sealed class EvidenceBundleDeserializationTests
{
    [Fact]
    public void Deserialize_null_collection_properties_yields_empty_lists_not_null()
    {
        const string json = """
            {
              "evidenceBundleId": "eb1",
              "requestDescription": "req",
              "policyRefs": null,
              "serviceCatalogRefs": null,
              "priorManifestRefs": null
            }
            """;

        EvidenceBundle bundle = JsonSerializer.Deserialize<EvidenceBundle>(json, ContractJson.Default)!;

        bundle.PolicyRefs.Should().NotBeNull().And.BeEmpty();
        bundle.ServiceCatalogRefs.Should().NotBeNull().And.BeEmpty();
        bundle.PriorManifestRefs.Should().NotBeNull().And.BeEmpty();
    }

    [Fact]
    public void Deserialize_null_metadata_yields_empty_dictionary_not_null()
    {
        const string json = """
            {
              "evidenceBundleId": "eb1",
              "requestDescription": "req",
              "metadata": null
            }
            """;

        EvidenceBundle bundle = JsonSerializer.Deserialize<EvidenceBundle>(json, ContractJson.Default)!;

        bundle.Metadata.Should().NotBeNull().And.BeEmpty();
    }
}
