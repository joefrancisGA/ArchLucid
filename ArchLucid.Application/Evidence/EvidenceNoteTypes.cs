namespace ArchLucid.Application.Evidence;

/// <summary>
///     Well-known <c>NoteType</c> values written to <see cref="ArchLucid.Contracts.Agents.EvidenceNote.NoteType" />
///     by the evidence-building pipeline. Centralised here to prevent typos and keep
///     note-type strings consistent across producers, consumers, and tests.
/// </summary>
public static class EvidenceNoteTypes
{
    /// <summary>Records which execution mode was used to build the evidence package.</summary>
    public const string ExecutionMode = "ExecutionMode";

    /// <summary>
    ///     Indicates a <c>PriorManifestVersion</c> was requested but prior-manifest
    ///     hydration is not yet implemented. Agents should treat the run as greenfield.
    /// </summary>
    public const string PriorManifestUnavailable = "PriorManifestUnavailable";

    /// <summary>Provides a hint about which architecture pattern applies to the request.</summary>
    public const string PatternHint = "PatternHint";

    /// <summary>
    ///     Bounded, redacted text summary of prior agents' results when <c>ArchLucid:Agents:StagedCriticEnabled</c>
    ///     is on (see <c>RealAgentExecutor</c>). Consumed by the Critic user prompt only.
    /// </summary>
    public const string StagedPriorAgentsSummary = "StagedPriorAgentsSummary";

    /// <summary>Recorded when the optional staged Critic phase exceeds <c>ArchLucid:Agents:CriticTimeoutSeconds</c>.</summary>
    public const string CriticTimeout = "CriticTimeout";
}
