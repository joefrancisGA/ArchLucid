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

            parsed.LastOpenArchitectureId = NormalizeOptionalId(parsed.LastOpenArchitectureId);
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
            LastOpenArchitectureId = NormalizeOptionalId(continuity.LastOpenArchitectureId),
            LastOpenReviewId = NormalizeOptionalId(continuity.LastOpenReviewId),
            LastOpenDraftId = NormalizeOptionalId(continuity.LastOpenDraftId),
            LastVisitWatermarkUtc = NormalizeOptionalTimestamp(continuity.LastVisitWatermarkUtc),
        };

        return JsonSerializer.Serialize(normalized, JsonOptions);
    }

    /// <summary>
    ///     Read-model backfill: when legacy prefs stored only a review id, promote a resolved architecture id
    ///     without dropping the child review pointer (AO-48).
    /// </summary>
    public static DeskContinuityDto ApplyReadBackfill(
        DeskContinuityDto continuity,
        string? architectureIdFromReviewLookup)
    {
        ArgumentNullException.ThrowIfNull(continuity);

        if (NormalizeOptionalId(continuity.LastOpenArchitectureId) is not null)
        {
            return continuity;
        }

        string? backfilledArchitectureId = NormalizeOptionalId(architectureIdFromReviewLookup);

        if (backfilledArchitectureId is null)
        {
            return continuity;
        }

        return new DeskContinuityDto
        {
            LastOpenArchitectureId = backfilledArchitectureId,
            LastOpenReviewId = continuity.LastOpenReviewId,
            LastOpenDraftId = continuity.LastOpenDraftId,
            LastVisitWatermarkUtc = continuity.LastVisitWatermarkUtc,
        };
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
