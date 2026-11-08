namespace ArchLucid.Application.Agents.Evidence;

/// <summary>Normalizes curated-evidence payload strings before persistence or promotion (TB-274).</summary>
internal static class ProposedEvidencePayloadNormalizer
{
    public static void NormalizeTextFields(ProposedEvidencePayload payload)
    {
        ArgumentNullException.ThrowIfNull(payload);

        payload.Type = payload.Type.Trim();
        payload.Title = payload.Title.Trim();
        payload.Description = payload.Description.Trim();
        payload.Rationale = payload.Rationale.Trim();
    }
}
