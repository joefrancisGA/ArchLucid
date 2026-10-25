using System.Text.Json;

namespace ArchLucid.Application.Agents.Evidence;

/// <summary>Validates persisted <c>ProposedEvidenceJson</c> before operator promotion (TB-274).</summary>
public static class ProposedEvidencePayloadValidator
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    public static bool TryParseValid(string? proposedEvidenceJson, out ProposedEvidencePayload payload)
    {
        payload = new ProposedEvidencePayload();

        if (string.IsNullOrWhiteSpace(proposedEvidenceJson))
            return false;

        try
        {
            ProposedEvidencePayload? parsed =
                JsonSerializer.Deserialize<ProposedEvidencePayload>(proposedEvidenceJson, JsonOptions);

            if (parsed is null)
                return false;

            if (!ProposedEvidenceSupportedTypes.IsSupported(parsed.Type))
                return false;

            if (!ProposedEvidenceTextValidation.HasSubstantiveText(parsed.Title))
                return false;

            if (!ProposedEvidenceTextValidation.HasSubstantiveText(parsed.Description))
                return false;

            if (!ProposedEvidenceTextValidation.HasSubstantiveText(parsed.Rationale))
                return false;

            ProposedEvidencePayloadNormalizer.NormalizeTextFields(parsed);
            payload = parsed;
            return true;
        }
        catch (JsonException)
        {
            return false;
        }
    }

}
