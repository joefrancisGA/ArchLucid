using System.Diagnostics.CodeAnalysis;

namespace ArchLucid.Core.Configuration;

/// <summary>
///     Optional Azure OpenAI rubric-based judge over persisted <c>AgentResult</c> JSON (post-execute / on-demand API).
///     Binds <c>ArchLucid:AgentOutput:LlmSemanticJudge</c> (legacy) first, then <c>ArchLucid:Agents:LlmJudge</c> so canonical
///     <c>Agents</c> keys override legacy when both are present.
/// </summary>
[ExcludeFromCodeCoverage(Justification = "Configuration binding DTO with no logic.")]
public sealed class AgentOutputLlmSemanticJudgeOptions
{
    /// <summary>Canonical operator path (assessment item 21).</summary>
    public const string SectionPath = "ArchLucid:Agents:LlmJudge";

    /// <summary>Legacy path; still bound after <see cref="SectionPath" /> for backward compatibility.</summary>
    public const string LegacySectionPath = "ArchLucid:AgentOutput:LlmSemanticJudge";

    /// <summary>When false, only deterministic heuristic scoring is used. Defaults to <c>false</c> (opt-in).</summary>
    public bool Enabled
    {
        get;
        set;
    } = false;

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

    /// <summary>
    ///     Blend weight for combining heuristic and judge scores: overall semantic score =
    ///     BlendWeight × judge quality + (1 − BlendWeight) × heuristic score (clamped to 0..1 at runtime).
    /// </summary>
    public double BlendWeight
    {
        get;
        set;
    } = 0.5;

    /// <summary>
    ///     When judge vs heuristic disagreement exceeds this threshold and either score is below the semantic warn floor,
    ///     trace evaluation elevates accepted gates to warned.
    /// </summary>
    public double WarnGateWhenJudgeHeuristicDisagreementAbove
    {
        get;
        set;
    } = 0.4;

    /// <summary>Parallel judge completion attempts (median quality + dispersion when &gt;1).</summary>
    public int JudgeInvocationCount
    {
        get;
        set;
    } = 1;

    /// <summary>When true and <c>AgentExecution:Mode</c> is Simulator, the judge is skipped (saves quota).</summary>
    public bool SkipWhenSimulator
    {
        get;
        set;
    } = true;
}
