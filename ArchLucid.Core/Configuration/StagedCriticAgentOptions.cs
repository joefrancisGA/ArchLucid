namespace ArchLucid.Core.Configuration;

/// <summary>
///     Optional staged execution: run the Critic agent after other agents in the same batch finish, with a bounded summary
///     of their <see cref="ArchLucid.Contracts.Agents.AgentResult" /> payloads injected into evidence notes (real executor
///     path only). Not autonomous planning — see product scope docs.
/// </summary>
public sealed class StagedCriticAgentOptions
{
    public const string SectionPath = "ArchLucid:Agents";

    /// <summary>When <see langword="true"/>, <c>RealAgentExecutor</c> runs non-Critic tasks first, then Critic.</summary>
    public bool StagedCriticEnabled
    {
        get;
        set;
    }

    /// <summary>Upper bound on the injected summary body (characters). Default 12 000.</summary>
    public int SummaryMaxTotalChars
    {
        get;
        set;
    } = 12_000;

    /// <summary>Upper bound per prior agent section inside the summary. Default 4 000.</summary>
    public int SummaryPerAgentMaxChars
    {
        get;
        set;
    } = 4_000;

    /// <summary>Max claim lines excerpted per prior agent. Default 8.</summary>
    public int MaxClaimsPerAgentIncluded
    {
        get;
        set;
    } = 8;

    /// <summary>Max characters per claim excerpt after redaction. Default 240.</summary>
    public int MaxClaimLineChars
    {
        get;
        set;
    } = 240;

    /// <summary>Max finding titles listed per agent (severity + truncated title). Default 5.</summary>
    public int MaxFindingTitlesPerAgent
    {
        get;
        set;
    } = 5;

    /// <summary>Max characters per finding title excerpt. Default 100.</summary>
    public int MaxFindingTitleChars
    {
        get;
        set;
    } = 100;

    /// <summary>Clamps tuning knobs after configuration bind.</summary>
    public void Normalize()
    {
        SummaryMaxTotalChars = Math.Clamp(SummaryMaxTotalChars, 2_000, 100_000);
        SummaryPerAgentMaxChars = Math.Clamp(SummaryPerAgentMaxChars, 500, SummaryMaxTotalChars);
        MaxClaimsPerAgentIncluded = Math.Clamp(MaxClaimsPerAgentIncluded, 0, 50);
        MaxClaimLineChars = Math.Clamp(MaxClaimLineChars, 40, 2_000);
        MaxFindingTitlesPerAgent = Math.Clamp(MaxFindingTitlesPerAgent, 0, 30);
        MaxFindingTitleChars = Math.Clamp(MaxFindingTitleChars, 40, 500);
    }
}
