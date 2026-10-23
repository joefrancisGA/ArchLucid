namespace ArchLucid.Application.Analysis;

public static class RunExportRecordIdNormalizer
{
    public static string NormalizeRequired(string exportRecordId)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(exportRecordId);
        return exportRecordId.Trim();
    }
}
