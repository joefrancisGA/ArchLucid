using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.GoldenCorpus;

using FluentAssertions;

namespace ArchLucid.Core.Tests.GoldenCorpus;

[Trait("Category", "Unit")]
[Trait("Suite", "GoldenCohort")]
public sealed class GoldenCohortArchitectureRequestFactoryTests
{
    [Fact]
    public void FromCohortItem_persists_empty_transparency_trail_sections()
    {
        GoldenCohortItem item = new()
        {
            Id = "gc-trail",
            Title = "Empty trail seal",
        };

        ArchitectureRequest request = GoldenCohortArchitectureRequestFactory.FromCohortItem(item);

        request.IntakeTransparencyTrail.Should().NotBeNull();
        request.IntakeTransparencyTrail!.Asserted.Should().BeEmpty();
        request.IntakeTransparencyTrail.Inferred.Should().BeEmpty();
        request.IntakeTransparencyTrail.Skipped.Should().BeEmpty();
    }

    [Fact]
    public void FromCohortItem_throws_when_item_is_null()
    {
        Action act = () => GoldenCohortArchitectureRequestFactory.FromCohortItem(null!);

        act.Should().Throw<ArgumentNullException>().WithParameterName("item");
    }
}
