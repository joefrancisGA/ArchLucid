using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Manifest;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Manifest;

[Trait("Category", "Unit")]
public sealed class ManifestGovernanceDeserializationTests
{
    [Fact]
    public void Deserialize_null_collection_properties_yields_empty_lists_not_null()
    {
        const string json = """
            {
              "complianceTags": null,
              "policyConstraints": null,
              "requiredControls": null
            }
            """;

        ManifestGovernance governance =
            JsonSerializer.Deserialize<ManifestGovernance>(json, ContractJson.Default)!;

        governance.ComplianceTags.Should().NotBeNull().And.BeEmpty();
        governance.PolicyConstraints.Should().NotBeNull().And.BeEmpty();
        governance.RequiredControls.Should().NotBeNull().And.BeEmpty();
    }
}
