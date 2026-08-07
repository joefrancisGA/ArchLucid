using ArchLucid.Application.Analysis;
using ArchLucid.Application.Findings;
using ArchLucid.Contracts.Findings;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Findings;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class ComparisonFindingCorrelationMetadataBuilderTests
{
    [SkippableFact]
    public void Build_documentsFuzzyHonesty_whenOnlyFuzzyMatchesExist()
    {
        CrossReviewFindingCorrelationResult correlation = new()
        {
            FuzzyMatchCount = 2,
            PolicyRuleMatchCount = 0,
        };

        ComparisonFindingCorrelationMetadata metadata =
            ComparisonFindingCorrelationMetadataBuilder.Build(correlation);

        metadata.PrimaryCorrelationMethod.Should().Be(nameof(FindingCorrelationMethod.MessageCategoryFuzzy));
        metadata.HonestyNote.Should().Contain("possible match");
    }
}
