namespace ArchLucid.Core.Evidence;

/// <summary>
///     Well-known <c>NoteType</c> values written to <see cref="ArchLucid.Contracts.Agents.EvidenceNote.NoteType" />.
/// </summary>
public static class EvidenceNoteTypes
{
    public const string ExecutionMode = "ExecutionMode";

    public const string PriorManifestUnavailable = "PriorManifestUnavailable";

    public const string PatternHint = "PatternHint";

    public const string StagedPriorAgentsSummary = "StagedPriorAgentsSummary";

    public const string CriticTimeout = "CriticTimeout";
}
