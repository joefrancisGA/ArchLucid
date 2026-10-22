using ArchLucid.Application.Drafts;
using ArchLucid.Contracts.Drafts;

namespace ArchLucid.Application.Tests.Drafts;

/// <summary>Test double that admits all drafts without invoking LLM or heuristics.</summary>
internal sealed class PassThroughDraftSemanticAdmissionEvaluator : IDraftSemanticAdmissionEvaluator
{
    public Task<DraftSemanticAdmissionEvaluation> EvaluateAsync(
        DraftRequestDocument document,
        CancellationToken cancellationToken) =>
        Task.FromResult(new DraftSemanticAdmissionEvaluation
        {
            Disposition = DraftSemanticAdmissionDispositionKind.Admitted,
        });
}
