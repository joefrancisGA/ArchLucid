using ArchLucid.Application.Findings;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Persistence;
using ArchLucid.Decisioning.Findings;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Findings;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class FindingSemanticSupportBandOverlayApplierTests
{
    [Fact]
    public void ApplyToAgentResults_sets_band_from_overlay_without_touching_message()
    {
        ArchitectureFinding finding = new()
        {
            FindingId = "finding-1",
            Message = "Sealed claim text must stay unchanged.",
            SemanticSupportBand = FindingSemanticSupportBand.Unchecked,
        };

        AgentResult result = new()
        {
            ResultId = "result-1",
            Findings = [finding],
        };

        Dictionary<string, FindingSemanticSupportBandOverlayRecord> overlays = new(StringComparer.Ordinal)
        {
            ["finding-1"] = new FindingSemanticSupportBandOverlayRecord
            {
                FindingId = "finding-1",
                Band = FindingSemanticSupportBand.Supported,
                ScorerVersion = "as057-v1",
            },
        };

        FindingSemanticSupportBandOverlayApplier.ApplyToAgentResults([result], overlays);

        finding.SemanticSupportBand.Should().Be(FindingSemanticSupportBand.Supported);
        finding.Message.Should().Be("Sealed claim text must stay unchanged.");
        finding.SemanticSupportBandScorerVersion.Should().Be("as057-v1");
    }

    [Fact]
    public void ApplyToFindings_copies_as099_overlay_scorer_version()
    {
        Finding finding = new()
        {
            FindingId = "finding-2",
            SemanticSupportBand = FindingSemanticSupportBand.Unchecked,
        };

        Dictionary<string, FindingSemanticSupportBandOverlayRecord> overlays = new(StringComparer.Ordinal)
        {
            ["finding-2"] = new FindingSemanticSupportBandOverlayRecord
            {
                FindingId = "finding-2",
                Band = FindingSemanticSupportBand.Supported,
                ScorerVersion = FindingSemanticSupportBandScorerVersions.As099LlmFinalizeV1,
            },
        };

        FindingSemanticSupportBandOverlayApplier.ApplyToFindings([finding], overlays);

        finding.SemanticSupportBand.Should().Be(FindingSemanticSupportBand.Supported);
        finding.SemanticSupportBandScorerVersion.Should().Be(FindingSemanticSupportBandScorerVersions.As099LlmFinalizeV1);
    }
}
