using ArchLucid.Contracts.Metadata;

namespace ArchLucid.Application.Analysis;

/// <summary>
///     Keeps determinism iteration fields aligned with <see cref="PersistedAnalysisExportRequest.IncludeDeterminismCheck" />.
/// </summary>
internal static class PersistedAnalysisExportRequestDeterminismNormalizer
{
    internal static void NormalizeRunExportRecordDenormalizedColumns(RunExportRecord record)
    {
        ArgumentNullException.ThrowIfNull(record);

        record.DeterminismIterations = NormalizeDenormalizedIterationsColumn(
            record.DeterminismIterations,
            record.IncludedDeterminismCheck);
    }

    internal static int? NormalizeDenormalizedIterationsColumn(int? iterations, bool? includedDeterminismCheck)
    {
        if (includedDeterminismCheck != true)
            return null;

        return iterations is null or 0 ? null : iterations;
    }

    internal static void ClearIterationsWhenCheckDisabled(PersistedAnalysisExportRequest request)
    {
        ArgumentNullException.ThrowIfNull(request);

        if (!request.IncludeDeterminismCheck)
            request.DeterminismIterations = 0;
    }

    internal static int? ToAuditDenormalizedColumn(PersistedAnalysisExportRequest? request)
    {
        if (request is null)
            return null;

        return NormalizeDenormalizedIterationsColumn(request.DeterminismIterations, request.IncludeDeterminismCheck);
    }
}
