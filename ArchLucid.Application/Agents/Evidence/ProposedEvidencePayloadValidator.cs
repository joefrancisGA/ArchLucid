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

            if (!IsSupportedType(parsed.Type))
                return false;

            if (string.IsNullOrWhiteSpace(parsed.Title))
                return false;

            if (string.IsNullOrWhiteSpace(parsed.Description))
                return false;

            payload = parsed;
            return true;
        }
        catch (JsonException)
        {
            return false;
        }
    }

    private static bool IsSupportedType(string type) =>
        type.Equals("Policy", StringComparison.OrdinalIgnoreCase)
        || type.Equals("Pattern", StringComparison.OrdinalIgnoreCase)
        || type.Equals("Service", StringComparison.OrdinalIgnoreCase);
}
