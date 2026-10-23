namespace ArchLucid.Application.Analysis;

internal static class RunExportRecordIdNormalizer
{
    internal static string NormalizeRequired(string exportRecordId)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(exportRecordId);
        return exportRecordId.Trim();
    }
}
