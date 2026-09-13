using System.Text.Json;
using System.Text.Json.Serialization;

namespace ArchLucid.Contracts.User;

/// <summary>Serialization and validation for stored Working workspace continuity JSON.</summary>
public static class WorkingWorkspaceContinuityValues
{
    private const int MaxFavoriteReviews = 20;
    private const int MaxRecentViewEntries = 8;

    private static readonly HashSet<string> AllowedRecentViewKinds = new(StringComparer.OrdinalIgnoreCase)
    {
        "review",
        "finding",
        "manifest",
        "page",
        "architecture",
    };

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
    };

    public static WorkingWorkspaceContinuityDto Default { get; } = new();

    public static WorkingWorkspaceContinuityDto NormalizeOrDefault(string? storedJson)
    {
        WorkingWorkspaceContinuityDto? parsed = TryParse(storedJson);

        return parsed ?? Default;
    }

    public static WorkingWorkspaceContinuityDto? TryParse(string? storedJson)
    {
        if (string.IsNullOrWhiteSpace(storedJson))
        {
            return null;
        }

        try
        {
            WorkingWorkspaceContinuityDto? parsed = JsonSerializer.Deserialize<WorkingWorkspaceContinuityDto>(
                storedJson.Trim(),
                JsonOptions);

            if (parsed is null)
            {
                return null;
            }

            return Normalize(parsed);
        }
        catch (JsonException)
        {
            return null;
        }
    }

    public static string Serialize(WorkingWorkspaceContinuityDto continuity)
    {
        ArgumentNullException.ThrowIfNull(continuity);

        return JsonSerializer.Serialize(Normalize(continuity), JsonOptions);
    }

    private static WorkingWorkspaceContinuityDto Normalize(WorkingWorkspaceContinuityDto continuity)
    {
        List<FavoriteReviewEntryDto> favoriteReviews = continuity.FavoriteReviews
            .Select(NormalizeFavoriteReview)
            .Where(entry => entry is not null)
            .Cast<FavoriteReviewEntryDto>()
            .Take(MaxFavoriteReviews)
            .ToList();

        List<OperatorRecentViewEntryDto> recentViewEntries = continuity.RecentViewEntries
            .Select(NormalizeRecentViewEntry)
            .Where(entry => entry is not null)
            .Cast<OperatorRecentViewEntryDto>()
            .Take(MaxRecentViewEntries)
            .ToList();

        return new WorkingWorkspaceContinuityDto
        {
            FavoriteReviews = favoriteReviews,
            RecentViewEntries = recentViewEntries,
            UpdatedAtUtc = NormalizeOptionalTimestamp(continuity.UpdatedAtUtc),
        };
    }

    private static FavoriteReviewEntryDto? NormalizeFavoriteReview(FavoriteReviewEntryDto? entry)
    {
        if (entry is null)
        {
            return null;
        }

        string? runId = NormalizeOptionalId(entry.RunId);
        string? pinnedAtUtc = NormalizeOptionalTimestamp(entry.PinnedAtUtc);

        if (runId is null || pinnedAtUtc is null)
        {
            return null;
        }

        string? title = NormalizeOptionalLabel(entry.Title);

        return new FavoriteReviewEntryDto
        {
            RunId = runId,
            Title = title,
            PinnedAtUtc = pinnedAtUtc,
        };
    }

    private static OperatorRecentViewEntryDto? NormalizeRecentViewEntry(OperatorRecentViewEntryDto? entry)
    {
        if (entry is null)
        {
            return null;
        }

        string? href = NormalizeOptionalLabel(entry.Href);
        string? label = NormalizeOptionalLabel(entry.Label);
        string? visitedAtUtc = NormalizeOptionalTimestamp(entry.VisitedAtUtc);

        if (href is null || label is null || visitedAtUtc is null)
        {
            return null;
        }

        string kind = NormalizeRecentViewKind(entry.Kind);

        return new OperatorRecentViewEntryDto
        {
            Href = href,
            Label = label,
            Kind = kind,
            VisitedAtUtc = visitedAtUtc,
            ArchitectureId = NormalizeOptionalId(entry.ArchitectureId),
            ParentArchitectureId = NormalizeOptionalId(entry.ParentArchitectureId),
        };
    }

    private static string NormalizeRecentViewKind(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return "page";
        }

        string trimmed = value.Trim();

        return AllowedRecentViewKinds.Contains(trimmed) ? trimmed.ToLowerInvariant() : "page";
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

    private static string? NormalizeOptionalLabel(string? value)
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
