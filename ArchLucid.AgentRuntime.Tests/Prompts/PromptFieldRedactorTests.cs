using ArchLucid.AgentRuntime.Prompts;

using FluentAssertions;

namespace ArchLucid.AgentRuntime.Tests.Prompts;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class PromptFieldRedactorTests
{
    [SkippableFact]
    public void RedactForPrompt_replaces_bearer_like_substring()
    {
        string s = PromptFieldRedactor.RedactForPrompt("token is Bearer abcdefghijklmnopqrstuvwxyz1234 here");

        s.Should().Contain("[redacted-secret]");
        s.Should().NotContain("Bearer abcdefghijklmnopqrstuvwxyz1234");
    }

    [SkippableFact]
    public void RedactForPrompt_replaces_email_like_substring()
    {
        string s = PromptFieldRedactor.RedactForPrompt("Contact ops@example.com for help.");

        s.Should().Contain("[redacted-email]");
        s.Should().NotContain("ops@example.com");
    }

    [SkippableFact]
    public void RedactForPrompt_returns_empty_for_null_or_empty()
    {
        PromptFieldRedactor.RedactForPrompt(null).Should().BeEmpty();
        PromptFieldRedactor.RedactForPrompt("").Should().BeEmpty();
    }
}
