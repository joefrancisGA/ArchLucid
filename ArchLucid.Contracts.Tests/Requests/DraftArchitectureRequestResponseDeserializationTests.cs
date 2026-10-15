using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Requests;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Requests;

[Trait("Category", "Unit")]
public sealed class DraftArchitectureRequestResponseDeserializationTests
{
    [Fact]
    public void Deserialize_null_suggested_string_arrays_yields_empty_arrays_not_null()
    {
        const string json = """
            {
              "suggestedConstraints": null,
              "suggestedCapabilities": null,
              "suggestedAssumptions": null,
              "topologyHints": null,
              "securityBaselineHints": null,
              "evidenceContradictedAssumptions": null
            }
            """;

        DraftArchitectureRequestResponse? response =
            JsonSerializer.Deserialize<DraftArchitectureRequestResponse>(json, ContractJson.CamelCaseCompact);

        response.Should().NotBeNull();
        response!.SuggestedConstraints.Should().NotBeNull().And.BeEmpty();
        response.SuggestedCapabilities.Should().NotBeNull().And.BeEmpty();
        response.SuggestedAssumptions.Should().NotBeNull().And.BeEmpty();
        response.TopologyHints.Should().NotBeNull().And.BeEmpty();
        response.SecurityBaselineHints.Should().NotBeNull().And.BeEmpty();
        response.EvidenceContradictedAssumptions.Should().NotBeNull().And.BeEmpty();
    }
}
