using System.Collections.Immutable;

using ArchLucid.Core.Llm.Redaction;

namespace ArchLucid.AgentRuntime.Tests.Support;

/// <summary>Passes text through unchanged — use when exercising flows that do not depend on deny-list rules.</summary>
public sealed class NoOpPromptRedactor : IPromptRedactor
{
    /// <inheritdoc />
    public PromptRedactionOutcome Redact(string? input) =>
        new(input ?? string.Empty, ImmutableDictionary<string, int>.Empty);

    /// <inheritdoc />
    public PromptRedactionOutcome RedactAlways(string? input) => Redact(input);
}
