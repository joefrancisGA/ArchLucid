using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.InfraEvidence;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.InfraEvidence;

[Trait("Category", "Unit")]
public sealed class SecurityEvidenceCutPointSummaryResponseDeserializationTests
{
    [Fact]
    public void Deserialize_null_collapsed_path_ids_yields_empty_list_not_null()
    {
        const string json = """
            {
              "collapsedPathIds": null
            }
            """;

        SecurityEvidenceCutPointSummaryResponse? summary =
            JsonSerializer.Deserialize<SecurityEvidenceCutPointSummaryResponse>(json, ContractJson.CamelCaseCompact);

        summary.Should().NotBeNull();
        summary!.CollapsedPathIds.Should().NotBeNull().And.BeEmpty();
    }

    [Fact]
    public void Deserialize_null_evidence_references_yields_empty_list_not_null()
    {
        const string json = """
            {
              "evidenceReferences": null
            }
            """;

        SecurityEvidenceCutPointSummaryResponse? summary =
            JsonSerializer.Deserialize<SecurityEvidenceCutPointSummaryResponse>(json, ContractJson.CamelCaseCompact);

        summary.Should().NotBeNull();
        summary!.EvidenceReferences.Should().NotBeNull().And.BeEmpty();
    }
}
