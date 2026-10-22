using ArchLucid.Application.Runs;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Requests;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Runs;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class ArchitectureRequestIntakeTrailHydratorTests
{
    [Fact]
    public void EnsureTrail_throws_when_request_is_null()
    {
        Action act = () => ArchitectureRequestIntakeTrailHydrator.EnsureTrail(null!);

        act.Should().Throw<ArgumentNullException>().WithParameterName("request");
    }

    [Fact]
    public void EnsureTrail_hydrates_empty_sections_when_trail_is_null()
    {
        ArchitectureRequest request = new()
        {
            RequestId = "req-trail-null",
        };

        ArchitectureRequestIntakeTrailHydrator.EnsureTrail(request);

        request.IntakeTransparencyTrail.Should().NotBeNull();
        request.IntakeTransparencyTrail!.Asserted.Should().BeEmpty();
        request.IntakeTransparencyTrail.Inferred.Should().BeEmpty();
        request.IntakeTransparencyTrail.Skipped.Should().BeEmpty();
    }

    [Fact]
    public void EnsureTrail_preserves_existing_trail()
    {
        TransparencyTrail existing = new()
        {
            Asserted =
            [
                new AssertedTrailEntry
                {
                    Key = "cloud",
                    Value = "Azure",
                },
            ],
        };
        ArchitectureRequest request = new()
        {
            RequestId = "req-trail-existing",
            IntakeTransparencyTrail = existing,
        };

        ArchitectureRequestIntakeTrailHydrator.EnsureTrail(request);

        request.IntakeTransparencyTrail.Should().BeSameAs(existing);
        request.IntakeTransparencyTrail!.Asserted.Should().ContainSingle(entry => entry.Key == "cloud");
    }
}
