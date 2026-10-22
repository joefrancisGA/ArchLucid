using ArchLucid.AgentRuntime.Evaluation;

using FluentAssertions;

namespace ArchLucid.AgentRuntime.Tests.Evaluation;

[Trait("Category", "Unit")]
public sealed class AgentOutputJudgePayloadTrimmerTests
{
    [Fact]
    public void Trim_does_not_leave_lone_high_surrogate_at_cut_boundary()
    {
        const int maxChars = 4096;
        string emoji = "\uD83D\uDE00";
        string text = new string('x', maxChars - 1) + emoji + new string('y', 200);

        string trimmed = AgentOutputJudgePayloadTrimmer.Trim(text, maxChars);

        trimmed.Length.Should().BeLessThan(text.Length);
        trimmed.Should().Contain("truncated_total_chars=" + text.Length.ToString(System.Globalization.CultureInfo.InvariantCulture));
        int newline = trimmed.IndexOf('\n', StringComparison.Ordinal);
        char lastPayloadChar = trimmed[newline - 1];
        char.IsHighSurrogate(lastPayloadChar).Should().BeFalse("truncation must not split a supplementary character");
    }

    [Fact]
    public void Trim_returns_original_when_under_limit()
    {
        string text = "short payload";

        AgentOutputJudgePayloadTrimmer.Trim(text, 4096).Should().BeSameAs(text);
    }
}
