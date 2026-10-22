namespace ArchLucid.Application.Integrations.Itsm.Outbound;

/// <summary>
///     ServiceNow Table API surface for Application CIs (<c>cmdb_ci_appl</c>). ArchLucid resolves architecture
///     <c>SystemName</c> to CMDB row <c>name</c> (exact match encoded query).
/// </summary>
internal static class ServiceNowCmdbCiApplTableApi
{
    /// <summary>Table API segment for Application class CIs — not generic <c>cmdb_ci</c>.</summary>
    internal const string TablePathSegment = "cmdb_ci_appl";

    /// <remarks><paramref name="systemNameForQuery"/> must already be trimmed; caller validates non-empty.</remarks>
    internal static string BuildLookupQueryString(string systemNameForQuery)
    {
        ArgumentNullException.ThrowIfNull(systemNameForQuery);

        string encodedName = Uri.EscapeDataString(systemNameForQuery);

        return $"sysparm_limit=1&sysparm_query=name={encodedName}";
    }

    /// <remarks><paramref name="systemNameForQuery"/> must already be trimmed; caller validates non-empty.</remarks>
    internal static Uri BuildLookupBySystemNameUri(Uri instanceRoot, string systemNameForQuery)
    {
        ArgumentNullException.ThrowIfNull(instanceRoot);
        ArgumentNullException.ThrowIfNull(systemNameForQuery);

        string root = instanceRoot.GetLeftPart(UriPartial.Authority).TrimEnd('/');
        string query = BuildLookupQueryString(systemNameForQuery);

        return new Uri($"{root}/api/now/table/{TablePathSegment}?{query}");
    }

    internal static Uri BuildCreateUri(Uri instanceRoot)
    {
        ArgumentNullException.ThrowIfNull(instanceRoot);

        string root = instanceRoot.GetLeftPart(UriPartial.Authority).TrimEnd('/');

        return new Uri($"{root}/api/now/table/{TablePathSegment}");
    }
}
