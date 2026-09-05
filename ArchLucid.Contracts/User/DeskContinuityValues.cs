using System.Text.Json;
using System.Text.Json.Serialization;

namespace ArchLucid.Contracts.User;

/// <summary>Serialization and validation for stored desk-continuity JSON.</summary>
public static class DeskContinuityValues
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
    };

    public static DeskContinuityDto Default { get; } = new();

    public static DeskContinuityDto NormalizeOrDefault(string? storedJson)
    {
        DeskContinuityDto? parsed = TryParse(storedJson);

        return parsed ?? Default;
    }

    public static DeskContinuityDto? TryParse(string? storedJson)
    {
        if (string.IsNullOrWhiteSpace(storedJson))
        {
            return null;
        }

        try
        {
            DeskContinuityDto? parsed = JsonSerializer.Deserialize<DeskContinuityDto>(storedJson.Trim(), JsonOptions);

            if (parsed is null)
            {
                return null;
            }

            parsed.LastOpenReviewId = NormalizeOptionalId(parsed.LastOpenReviewId);
            parsed.LastOpenDraftId = NormalizeOptionalId(parsed.LastOpenDraftId);
            parsed.LastVisitWatermarkUtc = NormalizeOptionalTimestamp(parsed.LastVisitWatermarkUtc);

            return parsed;
        }
        catch (JsonException)
        {
            return null;
        }
    }

    public static string Serialize(DeskContinuityDto continuity)
    {
        ArgumentNullException.ThrowIfNull(continuity);

        DeskContinuityDto normalized = new()
        {
            LastOpenReviewId = NormalizeOptionalId(continuity.LastOpenReviewId),
            LastOpenDraftId = NormalizeOptionalId(continuity.LastOpenDraftId),
            LastVisitWatermarkUtc = NormalizeOptionalTimestamp(continuity.LastVisitWatermarkUtc),
        };

        return JsonSerializer.Serialize(normalized, JsonOptions);
    }

    private static string? NormalizeOptionalId(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return null;
        }

        string trimmed = value.Trim();

        return trimmed.Length > 0 ? trimmed : null;
    }

    private static string? NormalizeOptionalTimestamp(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return null;
        }

        string trimmed = value.Trim();

        if (trimmed.Length == 0)
        {
            return null;
        }

        if (!DateTimeOffset.TryParse(trimmed, out _))
        {
            return null;
        }

        return trimmed;
    }
}
