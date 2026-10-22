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
              "findingsBySeverity": null
            }
            """;

        PilotRunDeltasResponse? result =
            JsonSerializer.Deserialize<PilotRunDeltasResponse>(json, ContractJson.CamelCaseCompact);

        result.Should().NotBeNull();
        result!.FindingsBySeverity.Should().NotBeNull().And.BeEmpty();
    }

    [Fact]
    public void Deserialize_null_proof_package_completeness_remains_null()
    {
        const string json = """
            {
              "proofPackageCompleteness": null
            }
            """;

        PilotRunDeltasResponse? result =
            JsonSerializer.Deserialize<PilotRunDeltasResponse>(json, ContractJson.CamelCaseCompact);

        result.Should().NotBeNull();
        result!.ProofPackageCompleteness.Should().BeNull();
    }

    [Fact]
    public void Deserialize_null_governed_finding_coverage_remains_null()
    {
        const string json = """
            {
              "governedFindingCoverage": null
            }
            """;

        PilotRunDeltasResponse? result =
            JsonSerializer.Deserialize<PilotRunDeltasResponse>(json, ContractJson.CamelCaseCompact);

        result.Should().NotBeNull();
        result!.GovernedFindingCoverage.Should().BeNull();
    }

    [Fact]
    public void Deserialize_null_top_finding_evidence_chain_remains_null()
    {
        const string json = """
            {
              "topFindingEvidenceChain": null
            }
            """;

        PilotRunDeltasResponse? result =
            JsonSerializer.Deserialize<PilotRunDeltasResponse>(json, ContractJson.CamelCaseCompact);

        result.Should().NotBeNull();
        result!.TopFindingEvidenceChain.Should().BeNull();
    }
}
