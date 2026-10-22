using System.Text.Json;

using ArchLucid.Contracts.ArchitectureIntelligence;
using ArchLucid.Contracts.Common;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.ArchitectureIntelligence;

[Trait("Category", "Unit")]
public sealed class SpecialistReviewFindingDeserializationTests
{
    [Fact]
    public void Deserialize_null_related_id_lists_yields_empty_lists_not_null()
    {
        const string json = """
            {
              "findingId": "f-1",
              "dimension": 0,
              "title": "t",
              "rationale": "r",
              "conclusion": 0,
              "evidenceCondition": 0,
              "confidence": 0.5,
              "severity": "Low",
              "evidenceArtifactIds": null,
              "relatedModelElementIds": null,
              "relatedRequirementElementIds": null,
              "relatedDecisionElementIds": null
            }
            """;

        SpecialistReviewFinding? finding =
            JsonSerializer.Deserialize<SpecialistReviewFinding>(json, ContractJson.CamelCaseCompact);

        finding.Should().NotBeNull();
        finding!.EvidenceArtifactIds.Should().NotBeNull().And.BeEmpty();
        finding.RelatedModelElementIds.Should().NotBeNull().And.BeEmpty();
        finding.RelatedRequirementElementIds.Should().NotBeNull().And.BeEmpty();
        finding.RelatedDecisionElementIds.Should().NotBeNull().And.BeEmpty();
    }

    [Fact]
    public void Deserialize_null_title_yields_empty_string_not_null()
    {
        const string json = """
            {
              "findingId": "f-1",
              "dimension": 0,
              "title": null,
              "rationale": "r",
              "conclusion": 0,
              "evidenceCondition": 0,
              "confidence": 0.5,
              "severity": "Low"
            }
            """;

        SpecialistReviewFinding? finding =
            JsonSerializer.Deserialize<SpecialistReviewFinding>(json, ContractJson.CamelCaseCompact);

        finding.Should().NotBeNull();
        finding!.Title.Should().BeEmpty();
    }

    [Fact]
    public void Deserialize_null_severity_yields_empty_string_not_null()
    {
        const string json = """
            {
              "findingId": "f-1",
              "dimension": 0,
              "title": "t",
              "rationale": "r",
              "conclusion": 0,
              "evidenceCondition": 0,
              "confidence": 0.5,
              "severity": null
            }
            """;

        SpecialistReviewFinding? finding =
            JsonSerializer.Deserialize<SpecialistReviewFinding>(json, ContractJson.CamelCaseCompact);

        finding.Should().NotBeNull();
        finding!.Severity.Should().BeEmpty();
    }

    [Fact]
    public void Deserialize_null_rationale_yields_empty_string_not_null()
    {
        const string json = """
            {
              "findingId": "f-1",
              "dimension": 0,
              "title": "t",
              "rationale": null,
              "conclusion": 0,
              "evidenceCondition": 0,
              "confidence": 0.5,
              "severity": "Low"
            }
            """;

        SpecialistReviewFinding? finding =
            JsonSerializer.Deserialize<SpecialistReviewFinding>(json, ContractJson.CamelCaseCompact);

        finding.Should().NotBeNull();
        finding!.Rationale.Should().BeEmpty();
    }

    [Fact]
    public void Deserialize_null_provenance_yields_non_null_provenance_not_null()
    {
        const string json = """
            {
              "findingId": "f-1",
              "dimension": 0,
              "title": "t",
              "rationale": "r",
              "conclusion": 0,
              "evidenceCondition": 0,
              "confidence": 0.5,
              "severity": "Low",
              "provenance": null
            }
            """;

        SpecialistReviewFinding? finding =
            JsonSerializer.Deserialize<SpecialistReviewFinding>(json, ContractJson.CamelCaseCompact);

        finding.Should().NotBeNull();
        finding!.Provenance.Should().NotBeNull();
    }
}
