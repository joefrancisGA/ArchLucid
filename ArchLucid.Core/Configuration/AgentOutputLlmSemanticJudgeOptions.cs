using System.Diagnostics.CodeAnalysis;

namespace ArchLucid.Core.Configuration;

/// <summary>
///     Optional Azure OpenAI rubric-based judge over persisted <c>AgentResult</c> JSON (post-execute / on-demand API).
/// </summary>
[ExcludeFromCodeCoverage(Justification = "Configuration binding DTO with no logic.")]
public sealed class AgentOutputLlmSemanticJudgeOptions
{
    public const string SectionPath = "ArchLucid:AgentOutput:LlmSemanticJudge";

    /// <summary>When false, only deterministic heuristic scoring is used. Defaults to <c>true</c>; skipped when credentials are missing.</summary>
    public bool Enabled
    {
        get;
        set;
    } = true;

    /// <summary>
    ///     Deployment name on the configured Azure OpenAI resource. Empty uses <see cref="AzureOpenAiOptions.DeploymentName" />.
    /// </summary>
    public string DeploymentName
    {
        get;
        set;
    } = string.Empty;

    /// <summary>Hard cap on characters of <c>ParsedResultJson</c> sent to the judge (tail is truncated).</summary>
    public int MaxInputCharacters
    {
        get;
        set;
    } = 56_000;

    /// <summary>Max completion tokens for the judge JSON response.</summary>
    public int MaxCompletionTokens
    {
        get;
        set;
    } = 400;

    /// <summary>Cancellation deadline for each judge completion call.</summary>
    public int TimeoutSeconds
    {
        get;
        set;
    } = 25;

    /// <summary>When true and <c>AgentExecution:Mode</c> is Simulator, the judge is skipped (saves quota).</summary>
    public bool SkipWhenSimulator
    {
        get;
        set;
    } = true;
}
