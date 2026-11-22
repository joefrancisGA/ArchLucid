namespace ArchLucid.Application.Agents.Evidence;

/// <summary>Normalizes curated-evidence payload strings before persistence or promotion (TB-274).</summary>
internal static class ProposedEvidencePayloadNormalizer
{
    public static void NormalizeTextFields(ProposedEvidencePayload payload)
    {
        ArgumentNullException.ThrowIfNull(payload);

        payload.Type = ProposedEvidenceTextValidation.StripUnicodeFormatCharacters(payload.Type.Trim());
        payload.Title = ProposedEvidenceTextValidation.StripUnicodeFormatCharacters(payload.Title.Trim());
        payload.Description = ProposedEvidenceTextValidation.StripUnicodeFormatCharacters(payload.Description.Trim());
        payload.Rationale = ProposedEvidenceTextValidation.StripUnicodeFormatCharacters(payload.Rationale.Trim());
    }
}
