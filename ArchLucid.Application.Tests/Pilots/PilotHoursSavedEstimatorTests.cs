using ArchLucid.Application.Pilots;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Pilots;

[Trait("Suite", "Core")]
public sealed class PilotHoursSavedEstimatorTests
{
    [Fact]
    public void Estimate_applies_weighted_components()
    {
        Dictionary<string, long> sev = new(StringComparer.Ordinal) { ["High"] = 3, ["Low"] = 2 };
        double hours = PilotHoursSavedEstimator.Estimate(4, sev, 10);

        hours.Should().BeApproximately(4 * 2.0 + 5 * 0.05 + 10 * 0.02, 0.0001d);
    }

    [Fact]
    public void Estimate_throws_when_dictionary_null()
    {
        Action act = () => PilotHoursSavedEstimator.Estimate(1, null!, 0);
        act.Should().Throw<ArgumentNullException>().WithParameterName("findingsBySeverity");
    }
}
