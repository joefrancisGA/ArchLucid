using System.Diagnostics;

using ArchiForge.Core.Diagnostics;

using FluentAssertions;

namespace ArchiForge.Decisioning.Tests;

/// <summary>
/// <see cref="ActivityCorrelation"/> is used by the API audit path and persistence activities; tests require an <see cref="ActivityListener"/> so <see cref="ActivitySource"/> <c>StartActivity</c> returns real instances.
/// </summary>
[Trait("Category", "Unit")]
public sealed class ActivityCorrelationTests
{
    private static readonly ActivitySource TestSource = new("ArchiForge.Tests.ActivityCorrelation");

    static ActivityCorrelationTests()
    {
        ActivityListener listener = new()
        {
            ShouldListenTo = s => s.Name == TestSource.Name,
            Sample = (ref _) => ActivitySamplingResult.AllData,
        };
        ActivitySource.AddActivityListener(listener);
    }

    [Fact]
    public void FindTagValueInChain_Throws_WhenTagNameIsWhitespace()
    {
        Action act = () => ActivityCorrelation.FindTagValueInChain(null, "  ");

        act.Should().Throw<ArgumentException>().WithParameterName("tagName");
    }

    [Fact]
    public void FindTagValueInChain_ReturnsNull_WhenStartIsNull()
    {
        string? value = ActivityCorrelation.FindTagValueInChain(
            null,
            ActivityCorrelation.LogicalCorrelationIdTag);

        value.Should().BeNull();
    }

    [Fact]
    public void FindTagValueInChain_ReturnsNearestTaggedAncestor()
    {
        using Activity? taggedAncestor = TestSource.StartActivity("ancestor");
        taggedAncestor?.SetTag(ActivityCorrelation.LogicalCorrelationIdTag, "corr-from-ancestor");
        using Activity? middle = TestSource.StartActivity("middle");
        using Activity? leaf = TestSource.StartActivity("leaf");

        string? found = ActivityCorrelation.FindTagValueInChain(
            Activity.Current,
            ActivityCorrelation.LogicalCorrelationIdTag);

        found.Should().Be("corr-from-ancestor");
    }
}
