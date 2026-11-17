using ArchLucid.Application.InfraEvidence.SecureNowArchitect;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Persistence.InfraEvidence;

using FluentAssertions;

namespace ArchLucid.Application.Tests.InfraEvidence;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class DefenderBandContextResolverTests
{
    [Fact]
    public void BuildHopPosture_only_lists_controls_with_a_score_gap()
    {
        AzureInventoryDefenderBandContextReadModel context = new()
        {
            DefenderScoreControls =
            [
                new AzureInventoryDefenderScoreControlReadModel { ControlName = "Complete", CurrentScore = 10, MaxScore = 10 },
                new AzureInventoryDefenderScoreControlReadModel { ControlName = "SmallerGap", CurrentScore = 8, MaxScore = 10 },
                new AzureInventoryDefenderScoreControlReadModel { ControlName = "LargerGap", CurrentScore = 2, MaxScore = 10 },
                new AzureInventoryDefenderScoreControlReadModel { ControlName = "NotScored" },
            ],
        };

        DefenderHopPostureEvidence posture =
            DefenderBandContextResolver.BuildHopPosture(context, DefenderSecureScoreOrdinalBand.Low);

        posture.WeakControlNames.Should().Equal("LargerGap", "SmallerGap");
    }
}
