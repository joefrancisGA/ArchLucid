using ArchLucid.Contracts.Drafts;

namespace ArchLucid.Application.Drafts.QuestionSelection;

/// <summary>Deterministic L0/L1 question selection for Socratic intake (ADR 0051; L2 explicitly out of scope).</summary>
public interface IQuestionSelectionEngine
{
    /// <summary>
    ///     Selects universal and pack-driven questions for the draft, returning unanswered MUST keys for submit gating.
    /// </summary>
    Task<QuestionSelectionResult> SelectAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        DraftRequestDocument document,
        CancellationToken cancellationToken);
}
