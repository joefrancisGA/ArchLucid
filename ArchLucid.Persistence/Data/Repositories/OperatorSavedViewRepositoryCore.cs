using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Operator;

namespace ArchLucid.Persistence.Data.Repositories;

/// <summary>
///     Shared operator saved-view repository rules for SQL and in-memory implementations.
/// </summary>
internal static class OperatorSavedViewRepositoryCore
{
    public static string? NormalizeSurfaceFilter(string? surface) =>
        string.IsNullOrWhiteSpace(surface) ? null : surface.Trim();

    public static bool IsVisibleToUser(
        Guid tenantId,
        string userId,
        string viewTenantUserId,
        Guid viewTenantId,
        bool isShared)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(userId);

        return viewTenantId == tenantId
               && (string.Equals(viewTenantUserId, userId, StringComparison.Ordinal) || isShared);
    }

    public static bool MatchesSurface(string viewSurface, string? surfaceFilter)
    {
        string? normalized = NormalizeSurfaceFilter(surfaceFilter);

        return normalized is null
               || string.Equals(viewSurface, normalized, StringComparison.OrdinalIgnoreCase);
    }

    public static bool IsDuplicateName(
        IEnumerable<OperatorSavedViewStoredRow> views,
        Guid tenantId,
        string userId,
        string surface,
        string name)
    {
        ArgumentNullException.ThrowIfNull(views);
        ArgumentException.ThrowIfNullOrWhiteSpace(userId);
        ArgumentException.ThrowIfNullOrWhiteSpace(surface);
        ArgumentException.ThrowIfNullOrWhiteSpace(name);

        return views.Any(view =>
            view.TenantId == tenantId
            && string.Equals(view.UserId, userId, StringComparison.Ordinal)
            && string.Equals(view.Surface, surface, StringComparison.OrdinalIgnoreCase)
            && string.Equals(view.Name, name, StringComparison.Ordinal));
    }

    public static OperatorSavedViewPayload DeserializePayload(string payloadJson)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(payloadJson);

        return JsonSerializer.Deserialize<OperatorSavedViewPayload>(
                   payloadJson,
                   ContractJson.CamelCaseDeserializeCaseInsensitive)
               ?? new OperatorSavedViewPayload();
    }

    public static OperatorSavedViewResponse MapToResponse(OperatorSavedViewStoredRow row, string currentUserId)
    {
        ArgumentNullException.ThrowIfNull(row);
        ArgumentException.ThrowIfNullOrWhiteSpace(currentUserId);

        return new OperatorSavedViewResponse
        {
            Id = row.Id,
            Surface = row.Surface,
            Name = row.Name,
            Payload = DeserializePayload(row.PayloadJson),
            CreatedUtc = row.CreatedUtc,
            UpdatedUtc = row.UpdatedUtc,
            IsShared = row.IsShared,
            IsOwnedByCurrentUser = string.Equals(row.UserId, currentUserId, StringComparison.Ordinal),
        };
    }

    public static IEnumerable<OperatorSavedViewStoredRow> OrderByName(
        IEnumerable<OperatorSavedViewStoredRow> views) =>
        views.OrderBy(static view => view.Name, StringComparer.Ordinal);

    public static InvalidOperationException CreateDuplicateNameException(string name, string surface) =>
        new($"A saved view named '{name}' already exists for surface '{surface}'.");
}

internal sealed class OperatorSavedViewStoredRow
{
    public Guid Id
    {
        get;
        init;
    }

    public Guid TenantId
    {
        get;
        init;
    }

    public string UserId
    {
        get;
        init;
    } = string.Empty;

    public string Surface
    {
        get;
        init;
    } = string.Empty;

    public string Name
    {
        get;
        init;
    } = string.Empty;

    public string? SortKey
    {
        get;
        init;
    }

    public bool IsShared
    {
        get;
        init;
    }

    public string PayloadJson
    {
        get;
        init;
    } = string.Empty;

    public DateTimeOffset CreatedUtc
    {
        get;
        init;
    }

    public DateTimeOffset UpdatedUtc
    {
        get;
        init;
    }
}
