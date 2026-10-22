using ArchLucid.Cli.Commands;

using FluentAssertions;

namespace ArchLucid.Cli.Tests.Commands;

[Trait("Suite", "Core")]
public sealed class PilotProofSurfaceContractTests
{
    [Fact]
    public void TrialSmokePilotRunDeltasShape_exposes_timing_field()
    {
        typeof(TrialSmokePilotRunDeltasShape)
            .GetProperty(nameof(TrialSmokePilotRunDeltasShape.TimeToCommittedManifestTotalSeconds))
            .Should()
            .NotBeNull();
    }
}
