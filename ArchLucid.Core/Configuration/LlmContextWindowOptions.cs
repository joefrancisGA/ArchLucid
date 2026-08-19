namespace ArchLucid.Core.Configuration;

/// <summary>
///     Azure OpenAI model context window guard (<c>ArchLucid:Llm:ContextWindow</c>).
/// </summary>
public sealed class LlmContextWindowOptions
{
    public const string SectionPath = "ArchLucid:Llm:ContextWindow";

    /// <summary>When false, context-length guards are disabled.</summary>
    public bool Enabled { get; set; } = true;

    /// <summary>Configured deployment max context length (input + output budget).</summary>
    public int MaxContextTokens { get; set; } = 128_000;

    /// <summary>Reject or truncate when estimated input exceeds this fraction of <see cref="MaxContextTokens" />.</summary>
    public double ThresholdRatio { get; set; } = 0.90;

    /// <summary>When true, truncates user prompt instead of throwing when over threshold.</summary>
    public bool TruncateUserPromptOnExceeded { get; set; } = true;
}
