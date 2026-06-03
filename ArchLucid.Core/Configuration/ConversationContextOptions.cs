namespace ArchLucid.Core.Configuration;

/// <summary>Opt-in multi-turn Ask conversation compression (TB-195).</summary>
public sealed class ConversationContextOptions
{
    public const string SectionPath = "Ask:ConversationContext";

    public bool CompressionEnabled
    {
        get;
        set;
    } = false;

    /// <summary>When history exceeds this count, compression may run.</summary>
    public int MaxVerbatimTurns
    {
        get;
        set;
    } = 6;

    /// <summary>Most recent turns kept verbatim after compression.</summary>
    public int MaxTurnsToKeepVerbatim
    {
        get;
        set;
    } = 4;
}
