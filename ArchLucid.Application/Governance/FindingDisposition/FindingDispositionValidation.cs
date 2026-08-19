using ArchLucid.Contracts.Governance;

using Disposition = ArchLucid.Contracts.Findings.FindingDisposition;

namespace ArchLucid.Application.Governance.FindingDisposition;

/// <summary>Validates TB-058 disposition requests before persistence.</summary>
public static class FindingDispositionValidation
{
    /// <summary>Matches <c>DISPOSITION_RATIONALE_MIN_CHARS</c> in the operator UI.</summary>
    public const int MinimumRationaleLength = 10;

    public static void Validate(RecordFindingDispositionRequest request)
    {
        ArgumentNullException.ThrowIfNull(request);

        if (string.IsNullOrWhiteSpace(request.FindingId))
            throw new ArgumentException("Finding id is required.", nameof(request));

        bool requiresRationale = request.Disposition is Disposition.Accepted
            or Disposition.Deferred
            or Disposition.RejectedAsNotApplicable;

        if (requiresRationale)
        {
            if (string.IsNullOrWhiteSpace(request.Rationale))
                throw new ArgumentException("Rationale is required for this disposition.", nameof(request));

            if (request.Rationale.Trim().Length < MinimumRationaleLength)
                throw new ArgumentException(
                    "Rationale must be at least 10 characters for this disposition.",
                    nameof(request));
        }

        if (request.Disposition == Disposition.Accepted)
        {
            if (string.IsNullOrWhiteSpace(request.TradeOffAcknowledgment))
                throw new ArgumentException(
                    "Trade-off acknowledgment is required when accepting a finding.",
                    nameof(request));

            if (request.TradeOffAcknowledgment.Trim().Length < MinimumRationaleLength)
                throw new ArgumentException(
                    "Trade-off acknowledgment must be at least 10 characters.",
                    nameof(request));
        }

        if (request.Disposition == Disposition.Deferred && request.RevisitDueUtc is null)
            throw new ArgumentException("Revisit due date is required when deferring.", nameof(request));

        if (request.Disposition == Disposition.NeedsEvidence && string.IsNullOrWhiteSpace(request.EvidenceRequestText))
            throw new ArgumentException("Evidence request text is required.", nameof(request));
    }
}
