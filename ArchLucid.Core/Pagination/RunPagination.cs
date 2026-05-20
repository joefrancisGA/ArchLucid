namespace ArchLucid.Core.Pagination;

/// <summary>
///     Run list pagination defaults aligned with perf plan (narrower than generic <see cref="PaginationDefaults" /> caps).
/// </summary>
public static class RunPagination
{
    /// <summary>Run list fetch when unset or invalid (keyset paths).</summary>
    public const int DefaultTake = 25;

    /// <summary>Default page size for offset-based <c>GET /v1/architecture/runs</c>.</summary>
    public const int DefaultLimit = 50;

    /// <summary>
    ///     Run list ceiling for keyset paths (FINDINGS_ARTIFACT_AUDIT_* use wider limits separately).
    /// </summary>
    public const int MaxTake = 100;

    /// <summary>Clamp <paramref name="take" /> to <see cref="DefaultTake" />..<see cref="MaxTake" />.</summary>
    public static int ClampTake(int take) => Math.Clamp(take <= 0 ? DefaultTake : take, 1, MaxTake);

    /// <summary>Clamp <paramref name="limit" /> to <see cref="DefaultLimit" />..<see cref="MaxTake" />.</summary>
    public static int ClampLimit(int limit) => Math.Clamp(limit <= 0 ? DefaultLimit : limit, 1, MaxTake);

    /// <summary>Normalize <paramref name="offset" /> to a non-negative skip count.</summary>
    public static int NormalizeOffset(int offset) => offset < 0 ? 0 : offset;
}
