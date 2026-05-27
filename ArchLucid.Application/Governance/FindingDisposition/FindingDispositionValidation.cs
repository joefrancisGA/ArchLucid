using ArchLucid.Contracts.Governance;

using Disposition = ArchLucid.Contracts.Findings.FindingDisposition;

namespace ArchLucid.Application.Governance.FindingDisposition;

/// <summary>Validates TB-058 disposition requests before persistence.</summary>
public static class FindingDispositionValidation
{
    public static void Validate(RecordFindingDispositionRequest request)
    {
        ArgumentNullException.ThrowIfNull(request);

        if (string.IsNullOrWhiteSpace(request.FindingId))
            throw new ArgumentException("Finding id is required.", nameof(request));

        bool requiresRationale = request.Disposition is Disposition.Accepted
            or Disposition.Deferred
            or Disposition.RejectedAsNotApplicable;

        if (requiresRationale && string.IsNullOrWhiteSpace(request.Rationale))
            throw new ArgumentException("Rationale is required for this disposition.", nameof(request));

        if (request.Disposition == Disposition.Deferred && request.RevisitDueUtc is null)
            throw new ArgumentException("Revisit due date is required when deferring.", nameof(request));

        if (request.Disposition == Disposition.NeedsEvidence && string.IsNullOrWhiteSpace(request.EvidenceRequestText))
            throw new ArgumentException("Evidence request text is required.", nameof(request));
    }
}
