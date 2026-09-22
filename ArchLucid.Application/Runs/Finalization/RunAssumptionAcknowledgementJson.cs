using System.Text.Json;

using ArchLucid.Contracts.Runs;

namespace ArchLucid.Application.Runs.Finalization;

/// <summary>JSON helpers for <see cref="RunAssumptionAcknowledgementDocument" /> on <c>dbo.Runs.AcknowledgedAssumptionsJson</c>.</summary>
public static class RunAssumptionAcknowledgementJson
{
    private static readonly JsonSerializerOptions SerializerOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        WriteIndented = false,
    };

    public static string Serialize(RunAssumptionAcknowledgementDocument document)
    {
        ArgumentNullException.ThrowIfNull(document);

        return JsonSerializer.Serialize(document, SerializerOptions);
    }

    /// <summary>Null on blank or malformed JSON so a corrupt column degrades to "nothing acknowledged" instead of 500.</summary>
    public static RunAssumptionAcknowledgementDocument? TryDeserialize(string? json)
    {
        if (string.IsNullOrWhiteSpace(json))
            return null;

        try
        {
            return JsonSerializer.Deserialize<RunAssumptionAcknowledgementDocument>(json, SerializerOptions);
        }
        catch (JsonException)
        {
            return null;
        }
    }

    /// <summary>Acknowledged ids as an ordinal set; empty when the column is null or unreadable.</summary>
    public static HashSet<string> ReadAcknowledgedIds(string? json)
    {
        RunAssumptionAcknowledgementDocument? document = TryDeserialize(json);

        return NormalizeIds(document?.AcknowledgedAssumptionIds);
    }

    /// <summary>Trims, drops blanks, and de-duplicates ids (ordinal, matching the client FNV-1a id shape).</summary>
    public static HashSet<string> NormalizeIds(IEnumerable<string>? ids)
    {
        if (ids is null)
            return new HashSet<string>(StringComparer.Ordinal);

        return ids
            .Where(static id => !string.IsNullOrWhiteSpace(id))
            .Select(static id => id.Trim())
            .ToHashSet(StringComparer.Ordinal);
    }
}
