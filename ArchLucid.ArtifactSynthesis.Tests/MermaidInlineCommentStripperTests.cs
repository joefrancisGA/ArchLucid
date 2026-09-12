using ArchLucid.ArtifactSynthesis.Renderers;

using FluentAssertions;

namespace ArchLucid.ArtifactSynthesis.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class MermaidInlineCommentStripperTests
{
    [Fact]
    public void Strip_removes_inline_comment_after_quoted_node_label()
    {
        string source = """
            flowchart TD
                n1["app-hi-test-wus-001"] %% al-type=microsoft
            """;

        string stripped = MermaidInlineCommentStripper.Strip(source);

        stripped.Should().Be("""
            flowchart TD
                n1["app-hi-test-wus-001"]
            """);
        stripped.Should().NotContain("al-type");
    }

    [Fact]
    public void Strip_keeps_full_line_comments()
    {
        string source = """
            flowchart TD
                %% al-type=Microsoft.Network/networkInterfaces al-rg=rg-network
                n_a1["nic-prod"]
            """;

        MermaidInlineCommentStripper.Strip(source).Should().Be(source);
    }

    [Fact]
    public void Strip_does_not_treat_percent_signs_inside_quoted_labels_as_comments()
    {
        string source = "flowchart TD\n    n1[\"rate%%off\"] %% al-rg=rg-network";

        MermaidInlineCommentStripper.Strip(source).Should().Be("flowchart TD\n    n1[\"rate%%off\"]");
    }

    [Fact]
    public void Strip_preserves_crlf_line_endings()
    {
        string source = "flowchart TD\r\n    n1[\"a\"] %% al-type=microsoft\r\n";

        MermaidInlineCommentStripper.Strip(source).Should().Be("flowchart TD\r\n    n1[\"a\"]\r\n");
    }

    [Fact]
    public void Strip_throws_when_source_is_null()
    {
        Action act = () => MermaidInlineCommentStripper.Strip(null!);

        act.Should().Throw<ArgumentNullException>();
    }

    [Fact]
    public void Strip_returns_empty_string_unchanged()
    {
        MermaidInlineCommentStripper.Strip(string.Empty).Should().BeEmpty();
    }
}
