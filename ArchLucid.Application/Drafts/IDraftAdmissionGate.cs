using ArchLucid.Contracts.Drafts;

namespace ArchLucid.Application.Drafts;

/// <summary>
///     Semantic admission gate: ≥1 actor + ≥1 functional outcome, else redirect (ADR 0048 / R6).
/// </summary>
public interface IDraftAdmissionGate
{
    /// <summary>
    ///     Evaluates whether the draft document has enough designable intent to admit.
    ///     Returns redirect reason when not admitted.
    /// </summary>
    DraftAdmissionEvaluation Evaluate(DraftRequestDocument document);
}
