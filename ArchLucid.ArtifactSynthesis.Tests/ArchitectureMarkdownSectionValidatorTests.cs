using ArchLucid.ArtifactSynthesis.Validation;

using FluentAssertions;

namespace ArchLucid.ArtifactSynthesis.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class ArchitectureMarkdownSectionValidatorTests
{
    [Fact]
    public void GetMissingSectionHeaders_when_null_or_whitespace_lists_all_required()
    {
        ArchitectureMarkdownSectionValidator.GetMissingSectionHeaders(null!)
            .Should()
            .Equal(ArchitectureMarkdownSectionValidator.RequiredSectionTitles);

        ArchitectureMarkdownSectionValidator.GetMissingSectionHeaders("   ")
            .Should()
            .Equal(ArchitectureMarkdownSectionValidator.RequiredSectionTitles);
    }

    [Fact]
    public void GetMissingSectionHeaders_when_all_second_level_headings_present_returns_empty()
    {
        string markdown = string.Join(
            Environment.NewLine,
            "## Objective",
            "## Assumptions",
            "## Constraints",
            "## Architecture Overview",
            "## Component Breakdown",
            "## Data Flow",
            "## Security Model",
            "## Operational Considerations");

        ArchitectureMarkdownSectionValidator.GetMissingSectionHeaders(markdown).Should().BeEmpty();
    }

    [Fact]
    public void GetMissingSectionHeaders_does_not_treat_plain_text_as_headings()
    {
        const string markdown = """
                                Objective Assumptions Constraints Architecture Overview Component Breakdown Data Flow Security Model Operational Considerations
                                """;

        ArchitectureMarkdownSectionValidator.GetMissingSectionHeaders(markdown)
            .Should()
            .Equal(ArchitectureMarkdownSectionValidator.RequiredSectionTitles);
    }

    [Fact]
    public void GetMissingSectionHeaders_ignores_level_three_heading_with_same_title()
    {
        const string markdown = "### Objective";

        ArchitectureMarkdownSectionValidator.GetMissingSectionHeaders(markdown)
            .Should()
            .Contain("Objective");
    }

    [Fact]
    public void GetMissingSectionHeaders_allows_extra_spaces_after_hashes()
    {
        const string markdown = "##  Objective";

        IReadOnlyList<string> missing = ArchitectureMarkdownSectionValidator.GetMissingSectionHeaders(markdown);

        missing.Should().NotContain("Objective");
    }

    [Fact]
    public void GetMissingSectionHeaders_is_case_insensitive_for_titles()
    {
        const string markdown = "## objective";

        ArchitectureMarkdownSectionValidator.GetMissingSectionHeaders(markdown)
            .Should()
            .NotContain("Objective");
    }
}
