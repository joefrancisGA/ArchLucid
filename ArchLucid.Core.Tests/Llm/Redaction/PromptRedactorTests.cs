using ArchLucid.Core.Configuration;
using ArchLucid.Core.Llm.Redaction;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Core.Tests.Llm.Redaction;

[Trait("Suite", "Core")]
public sealed class PromptRedactorTests
{
    [Fact]
    public void Redact_replaces_email_and_counts_category()
    {
        Mock<IOptionsMonitor<LlmPromptRedactionOptions>> monitor = new();
        monitor.Setup(m => m.CurrentValue).Returns(new LlmPromptRedactionOptions { Enabled = true });
        PromptRedactor sut = new(monitor.Object, NullLogger<PromptRedactor>.Instance);

        PromptRedactionOutcome outcome = sut.Redact("Contact ops@example.com today.");

        outcome.Text.Should().Be("Contact [REDACTED] today.");
        outcome.CountsByCategory.Should().ContainKey("email");
        outcome.CountsByCategory["email"].Should().BeGreaterThan(0);
    }

    [Fact]
    public void Redact_when_disabled_returns_unchanged_text()
    {
        Mock<IOptionsMonitor<LlmPromptRedactionOptions>> monitor = new();
        monitor.Setup(m => m.CurrentValue).Returns(new LlmPromptRedactionOptions { Enabled = false });
        PromptRedactor sut = new(monitor.Object, NullLogger<PromptRedactor>.Instance);

        const string input = "Contact ops@example.com today.";
        PromptRedactionOutcome outcome = sut.Redact(input);

        outcome.Text.Should().Be(input);
        outcome.CountsByCategory.Should().BeEmpty();
    }

    [Fact]
    public void Redact_null_returns_empty_without_throwing()
    {
        Mock<IOptionsMonitor<LlmPromptRedactionOptions>> monitor = new();
        monitor.Setup(m => m.CurrentValue).Returns(new LlmPromptRedactionOptions { Enabled = true });
        PromptRedactor sut = new(monitor.Object, NullLogger<PromptRedactor>.Instance);

        PromptRedactionOutcome outcome = sut.Redact(null);

        outcome.Text.Should().BeEmpty();
        outcome.CountsByCategory.Should().BeEmpty();
    }
}
