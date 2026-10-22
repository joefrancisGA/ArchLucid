using ArchLucid.Contracts.Drafts;

namespace ArchLucid.Application.Drafts;

/// <inheritdoc cref="IDraftAdmissionGate" />
public sealed class DraftAdmissionGate : IDraftAdmissionGate
{
    private const int MinimumIntentLength = DraftIntakeValidation.MinimumFreeTextIntentLength;

    /// <inheritdoc />
    public DraftAdmissionEvaluation Evaluate(DraftRequestDocument document)
    {
        ArgumentNullException.ThrowIfNull(document);

        string intent = document.FreeTextIntent?.Trim() ?? string.Empty;

        if (intent.Length < MinimumIntentLength)
        {
            return Redirect(
                $"I don't understand yet — please describe the system you want designed in at least {MinimumIntentLength} characters.");
        }

        if (!HasFunctionalOutcome(document))
        {
            return Redirect(
                "I can see text, but not a designable business outcome. What should using this system achieve?");
        }

        if (!document.ActorSet.MeetsAdmissionMinimum)
        {
            return Redirect(
                "I need at least one kind of user (human or machine) before I can reason about an architecture. Who uses this system?");
        }

        return new DraftAdmissionEvaluation { Admitted = true };
    }

    private static bool HasFunctionalOutcome(DraftRequestDocument document)
    {
        if (!string.IsNullOrWhiteSpace(document.BusinessOutcome))
            return true;

        return document.TransparencyTrail.Asserted.Exists(static entry =>
            string.Equals(entry.Key, "businessOutcome", StringComparison.OrdinalIgnoreCase)
            && !string.IsNullOrWhiteSpace(entry.Value));
    }

    private static DraftAdmissionEvaluation Redirect(string reason) =>
        new() { Admitted = false, RedirectReason = reason };
}
