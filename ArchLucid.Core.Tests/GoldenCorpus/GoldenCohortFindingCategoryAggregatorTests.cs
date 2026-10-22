using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Findings;
using ArchLucid.Core.GoldenCorpus;

using FluentAssertions;

namespace ArchLucid.Core.Tests.GoldenCorpus;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class GoldenCohortFindingCategoryAggregatorTests
{
    [Fact]
    public void DistinctCategories_NullResults_Throws()
    {
        Action act = () => GoldenCohortFindingCategoryAggregator.DistinctCategories(null!);

        act.Should().Throw<ArgumentNullException>().WithParameterName("results");
    }

    [Fact]
    public void DistinctCategories_EmptyResults_ReturnsEmptySet()
    {
        GoldenCohortFindingCategoryAggregator.DistinctCategories([]).Should().BeEmpty();
    }

    [Fact]
    public void DistinctCategories_TrimsDeduplicatesAndSortsOrdinal()
    {
        AgentResult first = new()
        {
            Findings =
            [
                new ArchitectureFinding
                {
                    Category = "  Security  ",
                },
                new ArchitectureFinding
                {
                    Category = "Cost",
                },
                new ArchitectureFinding
                {
                    Category = "   ",
                },
            ],
        };

        AgentResult second = new()
        {
            Findings =
            [
                new ArchitectureFinding
                {
                    Category = "Security",
                },
                new ArchitectureFinding
                {
                    Category = "Reliability",
                },

                // Ordinal comparison keeps this distinct from "Security".
                new ArchitectureFinding
                {
                    Category = "security",
                },
            ],
        };

        SortedSet<string> categories =
            GoldenCohortFindingCategoryAggregator.DistinctCategories([first, second]);

        categories.Should().Equal("Cost", "Reliability", "Security", "security");
    }
}
