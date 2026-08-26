namespace ArchLucid.Application.Findings;

/// <summary>Open governance commitment signal kinds emitted by <see cref="OpenCommitmentClassifier" />.</summary>
public enum OpenCommitmentSignalKind
{
    OverdueDeferral = 0,
    UnansweredEvidenceRequest = 1,
    ExpiringWaiver = 2,
    ExpiredWaiver = 3,
    OverdueRemediation = 4,
}
