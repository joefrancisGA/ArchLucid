namespace ArchLucid.Application.Analysis;

/// <summary>
///     Normalizes run id strings on persistence boundaries so list/search filters and stored comparison anchors agree.
/// </summary>
internal static class AnalysisRunIdCanonicalization
{
    public static string CanonicalRunIdForPersistence(string runId)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(runId);

        return Guid.TryParse(runId, out Guid guid) ? guid.ToString("N") : runId.Trim();
    }

    public static string? CanonicalRunIdForPersistenceOrNull(string? runId)
    {
        if (string.IsNullOrWhiteSpace(runId))
            return runId;

        return CanonicalRunIdForPersistence(runId);
    }
}
