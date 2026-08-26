namespace ArchLucid.Application.Roi;

/// <summary>Validation for <see cref="ArchLucid.Contracts.Governance.UpsertRealizedValueAttestationRequest" />.</summary>
public static class RealizedValueAttestationUpsertValidation
{
    public const int NoteMaxLength = 2000;

    public static void ValidateOrThrow(ArchLucid.Contracts.Governance.UpsertRealizedValueAttestationRequest request)
    {
        ArgumentNullException.ThrowIfNull(request);

        if (request.AttestedIncidentsAvoided is < 0)
        {
            throw new ArgumentException("AttestedIncidentsAvoided must be non-negative.");
        }

        ValidateNoteLength(request.AttestedRevenueOrRetentionImpact, nameof(request.AttestedRevenueOrRetentionImpact));
        ValidateNoteLength(request.AttestedReviewerTimeSavedNote, nameof(request.AttestedReviewerTimeSavedNote));
    }

    private static void ValidateNoteLength(string? value, string fieldName)
    {
        if (string.IsNullOrWhiteSpace(value))
            return;

        if (value.Trim().Length > NoteMaxLength)
        {
            throw new ArgumentException($"{fieldName} must be at most {NoteMaxLength} characters.");
        }
    }
}
