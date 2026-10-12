using ArchLucid.Application.Common;
using ArchLucid.Contracts.Drafts;

namespace ArchLucid.Application.Drafts;

/// <summary>Deterministic architecture-domain heuristic used when semantic LLM admission is disabled or fail-open.</summary>
public static class DraftAdmissionDomainHeuristic
{
    public static DraftSemanticAdmissionEvaluation Evaluate(DraftRequestDocument document)
    {
        ArgumentNullException.ThrowIfNull(document);

        string intent = document.FreeTextIntent?.Trim() ?? string.Empty;

        if (ArchitectureDomainAdmissionPattern.IsMatch(intent))
        {
            return new DraftSemanticAdmissionEvaluation
            {
                Disposition = DraftSemanticAdmissionDispositionKind.Admitted,
            };
        }

        return new DraftSemanticAdmissionEvaluation
        {
            Disposition = DraftSemanticAdmissionDispositionKind.NonArchitecture,
            RedirectReason =
                "REJECT-AS-WRITTEN: The request description does not appear to be related to software architecture. "
                + "Please provide more context about the system, components, or architectural constraints.",
        };
    }
}
