using System.Text;

using ArchLucid.Application.Pilots;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Contracts.Pilots;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Pilots;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class SponsorEvidenceBasisVerdictMarkdownFormatterTests
{
    [Fact]
    public void AppendMarkdownSection_RendersVerdictAndLabels()
    {
        StringBuilder sb = new();
        ProofPackageCompletenessResponse proof = new()
        {
            AgentOutputPilotStrictEvidenceSatisfied = true,
            RoiEvidenceConfidence = PilotRoiEvidenceConfidence.Strong,
        };

        PilotRunDeltas deltas = new();
        ArchitectureRun run = new() { RealModeFellBackToSimulator = false };

        SponsorEvidenceBasisVerdictMarkdownFormatter.AppendMarkdownSection(sb, proof, deltas, run);

        string md = sb.ToString();
        md.Should().Contain("## Evidence basis");
        md.Should().Contain("**Verdict:**");
        md.Should().Contain("**Labels applied:**");
        md.Should().Contain("**Evidence-backed**");
        md.Should().Contain("not legal, compliance, SOC 2");
        md.Should().Contain("product evidence posture");
    }
}
