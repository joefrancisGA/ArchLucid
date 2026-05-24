using ArchLucid.Core.Configuration;
using ArchLucid.Core.Llm.Redaction;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.AgentRuntime.Tests;

[Trait("Suite", "Core")]
public sealed class LlmPromptRedactionPiiTests
{
    [Theory]
    [InlineData("Card 4111-1111-1111-1111 please review.", "credit_card")]
    [InlineData("SSN 123-45-6789 attached.", "ssn")]
    [InlineData("Email ops@example.com for access.", "email")]
    public void Redact_replaces_known_pii_patterns(string input, string expectedCategory)
    {
        PromptRedactor sut = CreateSut();

        PromptRedactionOutcome outcome = sut.Redact(input);

        outcome.Text.Should().NotContain("4111");
        outcome.Text.Should().NotContain("123-45-6789");
        outcome.Text.Should().NotContain("ops@example.com");
        outcome.Text.Should().Contain("[REDACTED_PII]");
        outcome.CountsByCategory.Should().ContainKey(expectedCategory);
    }

    private static PromptRedactor CreateSut()
    {
        Mock<IOptionsMonitor<LlmPromptRedactionOptions>> monitor = new();
        monitor.Setup(m => m.CurrentValue).Returns(new LlmPromptRedactionOptions
        {
            Enabled = true,
            ReplacementToken = "[REDACTED_PII]",
        });

        return new PromptRedactor(monitor.Object, NullLogger<PromptRedactor>.Instance);
    }
}
