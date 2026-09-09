using ArchLucid.Core.Tenancy;

namespace ArchLucid.Application.Roi;

/// <summary>Validation for <see cref="ArchLucid.Contracts.Governance.UpsertRealizedValueAttestationRequest" />.</summary>
public static class RealizedValueAttestationUpsertValidation
{
    /// <summary>
    ///     Per-note cap sized for serialized JSON that must fit
    ///     <see cref="TenantSettingsSchemaLimits.SettingValueMaxLength" /> when both optional notes are populated.
    /// </summary>
    public const int NoteMaxLength = 204;

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

    public static void EnsureSerializedAttestationFitsOrThrow(string serializedAttestationJson)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(serializedAttestationJson);

        if (serializedAttestationJson.Length > TenantSettingsSchemaLimits.SettingValueMaxLength)
        {
            throw new ArgumentException(
                $"Realized-value attestation JSON must be at most {TenantSettingsSchemaLimits.SettingValueMaxLength} characters after serialization.");
        }
    }

    private static void ValidateNoteLength(string? value, string fieldName)
    {
        if (value is null)
            return;

        if (string.IsNullOrWhiteSpace(value))
        {
            throw new ArgumentException($"{fieldName} cannot be empty or whitespace.");
        }

        if (value.Trim().Length > NoteMaxLength)
        {
            throw new ArgumentException($"{fieldName} must be at most {NoteMaxLength} characters.");
        }
    }
}
