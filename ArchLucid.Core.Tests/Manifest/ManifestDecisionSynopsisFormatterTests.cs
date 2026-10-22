using ArchLucid.Core.Manifest;

using FluentAssertions;

namespace ArchLucid.Core.Tests.Manifest;

[Trait("Suite", "Core")]
public sealed class ManifestDecisionSynopsisFormatterTests
{
    [Fact]
    public void FormatSynopsis_prefers_title_and_selected_option()
    {
        ResolvedArchitectureDecision decision = new()
        {
            Title = "API gateway",
            SelectedOption = "Azure Application Gateway",
            Rationale = "Long rationale that should not win when title and option exist.",
        };

        string synopsis = ManifestDecisionSynopsisFormatter.FormatSynopsis(decision);

        synopsis.Should().Be("API gateway: Azure Application Gateway");
    }

    [Fact]
    public void FormatTopSynopses_caps_count_and_skips_empty_rows()
    {
        IReadOnlyList<ResolvedArchitectureDecision> decisions =
        [
            new ResolvedArchitectureDecision { Title = "One", SelectedOption = "A" },
            new ResolvedArchitectureDecision { Title = " ", SelectedOption = " " },
            new ResolvedArchitectureDecision { Title = "Two", SelectedOption = "B" },
            new ResolvedArchitectureDecision { Title = "Three", SelectedOption = "C" },
            new ResolvedArchitectureDecision { Title = "Four", SelectedOption = "D" },
        ];

        IReadOnlyList<string> synopses = ManifestDecisionSynopsisFormatter.FormatTopSynopses(decisions, maxCount: 3);

        synopses.Should().HaveCount(3);
        synopses[0].Should().Be("One: A");
        synopses[1].Should().Be("Two: B");
        synopses[2].Should().Be("Three: C");
    }
}
