namespace ArchLucid.Application.Analysis;

/// <summary>Outcome of building a run export ZIP without HTTP or audit side effects.</summary>
public sealed class RunExportPackageResult
{
    public bool Found
    {
        get;
        init;
    }

    public string? NotFoundReason
    {
        get;
        init;
    }

    public string? ProblemType
    {
        get;
        init;
    }

    public byte[]? ZipContent
    {
        get;
        init;
    }

    public string? ContentType
    {
        get;
        init;
    }

    public string? PackageFileName
    {
        get;
        init;
    }

    public Guid ManifestId
    {
        get;
        init;
    }

    public static RunExportPackageResult NotFound(string reason, string problemType)
    {
        return new RunExportPackageResult
        {
            Found = false,
            NotFoundReason = reason,
            ProblemType = problemType
        };
    }

    public static RunExportPackageResult Success(
        byte[] zipContent,
        string contentType,
        string packageFileName,
        Guid manifestId)
    {
        return new RunExportPackageResult
        {
            Found = true,
            ZipContent = zipContent,
            ContentType = contentType,
            PackageFileName = packageFileName,
            ManifestId = manifestId
        };
    }
}
