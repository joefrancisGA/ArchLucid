using ArchLucid.Contracts.Drafts;

namespace ArchLucid.Application.Drafts;

/// <summary>LLM or heuristic domain-fit admission after structural checks (ADR 0055).</summary>
public interface IDraftSemanticAdmissionEvaluator
{
    Task<DraftSemanticAdmissionEvaluation> EvaluateAsync(
        DraftRequestDocument document,
        CancellationToken cancellationToken);
}
