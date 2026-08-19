using ArchLucid.Contracts.Drafts;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Core.Ask;

/// <summary>
///     Manifest-free pre-run reasoning for Socratic intake drafts (SAQ-013 / ADR 0048).
/// </summary>
/// <remarks>
///     Sibling to <see cref="IAskService" /> — uses <c>IConversationService</c> with <c>runId=null</c>
///     and grounds answers in the mutable <see cref="DraftRequestDocument" /> only.
/// </remarks>
public interface IDraftIntakeReasoningService
{
    Task<DraftIntakeReasonResponse?> ReasonAsync(
        Guid draftId,
        DraftIntakeReasonRequest request,
        ScopeContext scope,
        CancellationToken cancellationToken);
}
