namespace ArchLucid.Application.Runs;

/// <summary>
///     Reserved <c>IntakeQuestionAnswers</c> keys for Quick start metadata (TB-2296).
/// </summary>
public static class QuickStartIntakeMetadataKeys
{
    public const string PendingEvidenceFileNamesKey = "intake.pending-evidence-file-names";

    public const string LimitedEvidenceAnalysisAckKey = "intake.limited-evidence-analysis-acknowledged";

    public const string OperatorBriefCharacterCountKey = "intake.operator-brief-character-count";

    public const string LimitedEvidenceAnalysisAckValue = "confirmed";

    public const char PendingEvidenceFileNameDelimiter = '\n';
}
