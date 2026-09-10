using ArchLucid.Contracts.Architecture;
using ArchLucid.Decisioning.CareerArtifacts;

using FluentAssertions;

namespace ArchLucid.Decisioning.Tests.CareerArtifacts;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class LegacySealedReExportHonestyResolverTests
{
    [Fact]
    public void Resolve_returns_true_when_trail_is_null()
    {
        LegacySealedReExportHonestyResolver.Resolve(null).Should().BeTrue();
    }

    [Fact]
    public void Resolve_returns_false_when_trail_exists()
    {
        LegacySealedReExportHonestyResolver.Resolve(new TransparencyTrail()).Should().BeFalse();
    }
}
