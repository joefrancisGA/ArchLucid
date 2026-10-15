using System.Text.Json;

using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Common;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Architecture;

[Trait("Category", "Unit")]
public sealed class FeasibilityVerdictDeserializationTests
{
    [Fact]
    public void Deserialize_null_collection_properties_yields_empty_lists_not_null()
    {
        const string json = """
            {
              "kind": 0,
              "summary": "ok",
              "transparencyTrail": {},
              "hardCitations": null,
              "unsatCoreInvariantKeys": null,
              "proposedRelaxations": null
            }
            """;

        FeasibilityVerdict verdict = JsonSerializer.Deserialize<FeasibilityVerdict>(json, ContractJson.Default)!;

        verdict.HardCitations.Should().NotBeNull().And.BeEmpty();
        verdict.UnsatCoreInvariantKeys.Should().NotBeNull().And.BeEmpty();
        verdict.ProposedRelaxations.Should().NotBeNull().And.BeEmpty();
    }

    [Fact]
    public void Deserialize_null_transparency_trail_yields_non_null_trail_not_null()
    {
        const string json = """
            {
              "kind": 0,
              "summary": "ok",
              "transparencyTrail": null
            }
            """;

        FeasibilityVerdict? verdict =
            JsonSerializer.Deserialize<FeasibilityVerdict>(json, ContractJson.Default);

        verdict.Should().NotBeNull();
        verdict!.TransparencyTrail.Should().NotBeNull();
    }
}
