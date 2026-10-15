using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Pilots;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Pilots;

[Trait("Category", "Unit")]
public sealed class PilotRunDeltasResponseDeserializationTests
{
    [Fact]
    public void Deserialize_null_findings_by_severity_yields_empty_list_not_null()
    {
        const string json = """
            {
              "findingsBySeverity": null,
              "roiMetricSources": null
            }
            """;

        PilotRunDeltasResponse? response =
            JsonSerializer.Deserialize<PilotRunDeltasResponse>(json, ContractJson.CamelCaseCompact);

        response.Should().NotBeNull();
        response!.FindingsBySeverity.Should().NotBeNull().And.BeEmpty();
        response.RoiMetricSources.Should().NotBeNull().And.BeEmpty();
    }

    [Fact]
    public void Deserialize_null_governed_finding_coverage_preserves_null_optional_metric()
    {
        const string json = """
            {
              "governedFindingCoverage": null
            }
            """;

        PilotRunDeltasResponse? response =
            JsonSerializer.Deserialize<PilotRunDeltasResponse>(json, ContractJson.CamelCaseCompact);

        response.Should().NotBeNull();
        response!.GovernedFindingCoverage.Should().BeNull();
    }

    [Fact]
    public void Deserialize_null_proof_package_completeness_preserves_null_nested_object()
    {
        const string json = """
            {
              "proofPackageCompleteness": null
            }
            """;

        PilotRunDeltasResponse? response =
            JsonSerializer.Deserialize<PilotRunDeltasResponse>(json, ContractJson.CamelCaseCompact);

        response.Should().NotBeNull();
        response!.ProofPackageCompleteness.Should().BeNull();
    }

    [Fact]
    public void Deserialize_undefined_structural_execution_mode_ordinal_throws()
    {
        const string json = """
            {
              "structuralExecutionMode": 99
            }
            """;

        Action act = () =>
            JsonSerializer.Deserialize<PilotRunDeltasResponse>(json, ContractJson.CamelCaseCompact);

        act.Should().Throw<JsonException>();
    }

    [Fact]
    public void Serialize_after_null_coalesced_lists_emits_empty_arrays_not_null()
    {
        const string json = """
            {
              "findingsBySeverity": null,
              "roiMetricSources": null
            }
            """;

        PilotRunDeltasResponse response =
            JsonSerializer.Deserialize<PilotRunDeltasResponse>(json, ContractJson.CamelCaseCompact)!;

        string serialized = JsonSerializer.Serialize(response, ContractJson.CamelCaseCompact);

        serialized.Should().Contain("\"findingsBySeverity\":[]");
        serialized.Should().Contain("\"roiMetricSources\":[]");
        serialized.Should().NotContain("\"findingsBySeverity\":null");
        serialized.Should().NotContain("\"roiMetricSources\":null");
    }
}
