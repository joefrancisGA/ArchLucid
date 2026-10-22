using ArchLucid.Application.Findings;
using ArchLucid.Contracts.Findings;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Findings;

[Trait("Category", "Unit")]
public sealed class CrossReviewFindingLifecycleExportLinesTests
{
    [Fact]
    public void Build_states_every_count_and_the_honesty_note()
    {
        CrossReviewFindingLifecycleSummary summary = new()
        {
            NewlyIdentifiedCount = 4,
            PreviouslyIdentifiedStillPresentCount = 3,
            ConfirmedResolvedCount = 2,
            UnverifiedResolvedCount = 1,
            AbsenceNotInformativeCount = 5,
            HonestyNote = "Qualifier text.",
        };

        IReadOnlyList<string> lines = CrossReviewFindingLifecycleExportLines.Build(summary);

        lines.Should().SatisfyRespectively(
            line => line.Should().Be("Newly identified findings: 4"),
            line => line.Should().Be("Previously identified, still present: 3"),
            line => line.Should().Be("Confirmed remediated by a recorded decision: 2"),
            line => line.Should().Be("No longer raised, no remediation decision recorded: 1"),
            line => line.Should().Be("No longer raised, absence not informative: 5"),
            line => line.Should().Be("Finding lifecycle honesty: Qualifier text."));
    }

    /// <summary>Export copy must never claim a bare "resolved" count without its qualifier.</summary>
    [Fact]
    public void Build_never_labels_a_count_as_plain_resolved()
    {
        IReadOnlyList<string> lines =
            CrossReviewFindingLifecycleExportLines.Build(new CrossReviewFindingLifecycleSummary());

        lines.Should().NotContain(line => line.StartsWith("Resolved", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public void Build_rejects_a_null_summary()
    {
        Action act = () => CrossReviewFindingLifecycleExportLines.Build(null!);

        act.Should().Throw<ArgumentNullException>();
    }
}
