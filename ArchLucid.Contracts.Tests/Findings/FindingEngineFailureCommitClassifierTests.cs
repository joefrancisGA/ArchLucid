using ArchLucid.Contracts.Findings;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Findings;

[Trait("Category", "Unit")]
public sealed class FindingEngineFailureCommitClassifierTests
{
    [Theory]
    [InlineData("Security", true)]
    [InlineData("Compliance", true)]
    [InlineData("Topology", false)]
    [InlineData("Cost", false)]
    public void IsCommitBlocking_classifies_by_category(string category, bool expectedBlocking)
    {
        FindingEngineFailure failure = new()
        {
            EngineType = "test-engine",
            Category = category,
            ErrorMessage = "boom",
            ExceptionType = nameof(InvalidOperationException),
            DurationMs = 1,
            OccurredUtc = DateTime.UtcNow,
        };

        FindingEngineFailureCommitClassifier.IsCommitBlocking(failure).Should().Be(expectedBlocking);
    }
}
