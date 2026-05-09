namespace ArchLucid.Core.Configuration;

/// <summary>
///     Product LLM knobs under <c>ArchLucid:Llm</c> (distinct from root <c>LlmTokenQuota</c> /
///     <c>LlmPromptRedaction</c> sections).
/// </summary>
public sealed class ArchLucidLlmOptions
{
    public const string SectionPath = "ArchLucid:Llm";

    /// <summary>
    ///     When <see langword="true" />, production <c>RealAgentExecutor</c> runs merged reasoning text through
    ///     <see cref="Llm.Redaction.IPromptRedactor.RedactAlways"/> before returning an
    ///     <see cref="ArchLucid.Contracts.Agents.AgentResult"/> so stored traces strip deny-listed patterns even if outbound
    ///     prompt redaction is disabled for diagnostics.
    /// </summary>
    public bool RedactReasoningTrace { get; set; }
}
