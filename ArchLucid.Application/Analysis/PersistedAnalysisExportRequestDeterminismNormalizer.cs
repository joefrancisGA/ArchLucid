namespace ArchLucid.Application.Analysis;

/// <summary>
///     Keeps determinism iteration fields aligned with <see cref="PersistedAnalysisExportRequest.IncludeDeterminismCheck" />.
/// </summary>
internal static class PersistedAnalysisExportRequestDeterminismNormalizer
{
    internal static void ClearIterationsWhenCheckDisabled(PersistedAnalysisExportRequest request)
    {
        ArgumentNullException.ThrowIfNull(request);

        if (!request.IncludeDeterminismCheck)
            request.DeterminismIterations = 0;
    }

    internal static int? ToAuditDenormalizedColumn(PersistedAnalysisExportRequest? request)
    {
        if (request is null || !request.IncludeDeterminismCheck)
            return null;

        int iterations = request.DeterminismIterations;

        return iterations is 0 ? null : iterations;
    }
}
