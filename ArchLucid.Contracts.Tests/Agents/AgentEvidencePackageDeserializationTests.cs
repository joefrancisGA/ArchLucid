using System.Text.Json;

using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Agents;

[Trait("Category", "Unit")]
public sealed class AgentEvidencePackageDeserializationTests
{
    [Fact]
    public void Deserialize_null_collection_properties_yields_empty_lists_not_null()
    {
        const string json = """
            {
              "evidencePackageId": "ep1",
              "request": {},
              "policies": null,
              "serviceCatalog": null,
              "patterns": null,
              "notes": null,
              "structuralGroundingDropLog": null
            }
            """;

        AgentEvidencePackage package = JsonSerializer.Deserialize<AgentEvidencePackage>(json, ContractJson.Default)!;

        package.Policies.Should().NotBeNull().And.BeEmpty();
        package.ServiceCatalog.Should().NotBeNull().And.BeEmpty();
        package.Patterns.Should().NotBeNull().And.BeEmpty();
        package.Notes.Should().NotBeNull().And.BeEmpty();
        package.StructuralGroundingDropLog.Should().NotBeNull().And.BeEmpty();
    }

    [Fact]
    public void Deserialize_null_request_evidence_yields_non_null_request_not_null()
    {
        const string json = """
            {
              "evidencePackageId": "ep1",
              "request": null
            }
            """;

        AgentEvidencePackage? package =
            JsonSerializer.Deserialize<AgentEvidencePackage>(json, ContractJson.Default);

        package.Should().NotBeNull();
        package!.Request.Should().NotBeNull();
    }
}
