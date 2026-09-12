using ArchLucid.Contracts.Architecture;
using ArchLucid.Decisioning.CareerArtifacts;

using FluentAssertions;

namespace ArchLucid.Decisioning.Tests.CareerArtifacts;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class WorkingCareerHardInfeasibleCitationValidatorTests
{
    [Fact]
    public void FormatBlockedReason_blocks_uncited_hard_on_working_export()
    {
        FeasibilityVerdict verdict = new()
        {
            Kind = FeasibilityVerdictKind.HardInfeasible,
            Summary = "Impossible under stated constraints.",
            Confidence = 100,
            TransparencyTrail = new TransparencyTrail(),
        };

        string? reason = WorkingCareerHardInfeasibleCitationValidator.FormatBlockedReason(
            verdict,
            workingDesk: true,
            artifactKind: CareerArtifactKind.Export);

        reason.Should().Be(WorkingCareerHardInfeasibleCitationValidator.UncitedHardMessage);
    }

    [Fact]
    public void FormatBlockedReason_allows_cited_hard_on_working_export()
    {
        FeasibilityVerdict verdict = new()
        {
            Kind = FeasibilityVerdictKind.HardInfeasible,
            Summary = "Impossible under stated constraints.",
            Confidence = 100,
            TransparencyTrail = new TransparencyTrail(),
            HardCitations =
            [
                new FeasibilityHardCitation
                {
                    Kind = FeasibilityCitationKind.NamedLaw,
                    Reference = "CAP theorem",
                },
            ],
        };

        string? reason = WorkingCareerHardInfeasibleCitationValidator.FormatBlockedReason(
            verdict,
            workingDesk: true,
            artifactKind: CareerArtifactKind.Export);

        reason.Should().BeNull();
    }

    [Fact]
    public void FormatBlockedReason_skips_guided_and_finalize()
    {
        FeasibilityVerdict verdict = new()
        {
            Kind = FeasibilityVerdictKind.HardInfeasible,
            Summary = "Impossible under stated constraints.",
            Confidence = 100,
            TransparencyTrail = new TransparencyTrail(),
        };

        WorkingCareerHardInfeasibleCitationValidator.FormatBlockedReason(
                verdict,
                workingDesk: false,
                artifactKind: CareerArtifactKind.Export)
            .Should()
            .BeNull();

        WorkingCareerHardInfeasibleCitationValidator.FormatBlockedReason(
                verdict,
                workingDesk: true,
                artifactKind: CareerArtifactKind.Finalize)
            .Should()
            .BeNull();
    }
}
