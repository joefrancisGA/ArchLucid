namespace ArchLucid.Core.Support;

public static class SupportProblemReportBundleBlobPaths
{
    public const string ContainerName = "support-problem-reports";

    public static string RelativePath(Guid reportId, string fileName)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(fileName);

        return $"{reportId:D}/{fileName}";
    }
}
