using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Risk;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Risk;

[Trait("Category", "Unit")]
public sealed class RequirementSmellDeserializationTests
{
    [Fact]
    public void Deserialize_integer_out_of_range_kind_throws()
    {
        const string json = """
            {
              "requirementId": "req-1",
              "kind": 99,
              "rationale": "test",
              "evidenceRefs": []
            }
            """;

        Action act = () => JsonSerializer.Deserialize<RequirementSmell>(json, ContractJson.Default);

        act.Should().Throw<JsonException>();
    }

    [Fact]
    public void Deserialize_defined_kind()
    {
        const string json = """
            {
              "requirementId": "req-1",
              "kind": 3,
              "rationale": "test",
              "evidenceRefs": []
            }
            """;

        RequirementSmell smell = JsonSerializer.Deserialize<RequirementSmell>(json, ContractJson.Default)!;

        smell.Kind.Should().Be(RequirementSmellKind.CostInfeasible);
    }

    [Fact]
    public void Deserialize_null_evidence_refs_yields_empty_list_not_null()
    {
        const string json = """
            {
              "requirementId": "req-1",
              "kind": 0,
              "rationale": "test",
              "evidenceRefs": null
            }
            """;

        RequirementSmell smell = JsonSerializer.Deserialize<RequirementSmell>(json, ContractJson.Default)!;

        smell.EvidenceRefs.Should().NotBeNull();
        smell.EvidenceRefs.Should().BeEmpty();
    }
}
