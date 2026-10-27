using ArchLucid.Application.Diffs;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Diffs;

[Trait("Category", "Unit")]
public sealed class RelationshipDiffItemDisplayTests
{
    [Fact]
    public void ToDisplayLine_includes_endpoint_type_and_description_honesty()
    {
        RelationshipDiffItem item = new()
        {
            SourceId = "s1",
            TargetId = "t1",
            RelationshipType = "calls",
        };

        item.ToDisplayLine()
            .Should()
            .Be("s1 -> t1 (calls). Relationship description was not stored.");

        item.Description = "  edge note  ";
        item.ToDisplayLine().Should().Be("s1 -> t1 (calls). edge note");
    }
}
