using ArchLucid.Application.Findings;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Persistence;

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
    }
}
