namespace ArchLucid.Core.Llm.Redaction;

/// <summary>Applies configured deny-list redaction to outbound LLM prompt material.</summary>
public interface IPromptRedactor
{
    /// <summary>When <paramref name="input" /> is null or empty, returns it unchanged with zero counts.</summary>
    PromptRedactionOutcome Redact(string? input);

    /// <summary>
    ///     Same deny-list and replacement token as <see cref="Redact"/>, but ignores
    ///     <see cref="LlmPromptRedactionOptions.Enabled"/> so stored reasoning traces can be scrubbed while
    ///     outbound prompt redaction stays off for diagnostics.
    /// </summary>
    PromptRedactionOutcome RedactAlways(string? input);
}
