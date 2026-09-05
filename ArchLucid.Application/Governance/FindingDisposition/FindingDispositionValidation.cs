using ArchLucid.Contracts.Governance;

using Disposition = ArchLucid.Contracts.Findings.FindingDisposition;

namespace ArchLucid.Application.Governance.FindingDisposition;

/// <summary>Validates TB-058 disposition requests before persistence.</summary>
public static class FindingDispositionValidation
{
    /// <summary>Matches <c>DISPOSITION_RATIONALE_MIN_CHARS</c> in the operator UI.</summary>
    public const int MinimumRationaleLength = 10;

    /// <summary>Matches inspect and stickiness route finding-id contract.</summary>
    public const int MaxFindingIdLength = 64;

    /// <summary>Matches governance review comment and promotion note caps.</summary>
    public const int MaximumRationaleLength = 4000;

    public static void Validate(RecordFindingDispositionRequest request, DateTimeOffset? nowUtc = null)
    {
        ArgumentNullException.ThrowIfNull(request);
        DateTimeOffset effectiveNowUtc = nowUtc ?? TimeProvider.System.GetUtcNow();

        if (!Enum.IsDefined(request.Disposition))
        {
            throw new ArgumentException("Disposition is not a supported finding disposition.", nameof(request));
        }

        if (string.IsNullOrWhiteSpace(request.FindingId))
            throw new ArgumentException("Finding id is required.", nameof(request));

        string normalizedFindingId = request.FindingId.Trim();

        if (normalizedFindingId.Length > MaxFindingIdLength)
        {
            throw new ArgumentException(
                $"Finding id must not exceed {MaxFindingIdLength} characters.",
                nameof(request));
        }

        bool requiresRationale = request.Disposition is Disposition.Accepted
            or Disposition.RejectedAsNotApplicable;

        if (requiresRationale)
        {
            if (string.IsNullOrWhiteSpace(request.Rationale))
                throw new ArgumentException("Rationale is required for this disposition.", nameof(request));

            if (request.Rationale.Trim().Length < MinimumRationaleLength)
                throw new ArgumentException(
                    "Rationale must be at least 10 characters for this disposition.",
                    nameof(request));

            if (request.Rationale.Trim().Length > MaximumRationaleLength)
            {
                throw new ArgumentException(
                    $"Rationale must not exceed {MaximumRationaleLength} characters.",
                    nameof(request));
            }
        }
        else if (!string.IsNullOrWhiteSpace(request.Rationale)
            && request.Rationale.Trim().Length > MaximumRationaleLength)
        {
            throw new ArgumentException(
                $"Rationale must not exceed {MaximumRationaleLength} characters.",
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

            if (request.TradeOffAcknowledgment.Trim().Length > MaximumRationaleLength)
            {
                throw new ArgumentException(
                    $"Trade-off acknowledgment must not exceed {MaximumRationaleLength} characters.",
                    nameof(request));
            }
        }

        if (request.Disposition == Disposition.Deferred && request.RevisitDueUtc is null)
            throw new ArgumentException("Revisit due date is required when deferring.", nameof(request));

        if (request.Disposition == Disposition.Deferred
            && request.RevisitDueUtc is not null
            && request.RevisitDueUtc <= effectiveNowUtc)
        {
            throw new ArgumentException("Revisit due date must be in the future when deferring.", nameof(request));
        }

        if (request.Disposition == Disposition.NeedsEvidence)
        {
            if (string.IsNullOrWhiteSpace(request.EvidenceRequestText))
                throw new ArgumentException("Evidence request text is required.", nameof(request));

            if (request.EvidenceRequestText.Trim().Length > MaximumRationaleLength)
            {
                throw new ArgumentException(
                    $"Evidence request text must not exceed {MaximumRationaleLength} characters.",
                    nameof(request));
            }
        }
    }
}
