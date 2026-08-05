namespace ArchLucid.Application.Analysis;

/// <summary>Outcome of <see cref="IRunExportAuthorityMaterialLoader.LoadAsync" />.</summary>
public sealed class RunExportAuthorityMaterialLoadResult
{
    private RunExportAuthorityMaterialLoadResult(
        RunExportAuthorityMaterial? material,
        bool runFound,
        bool manifestFound)
    {
        Material = material;
        RunFound = runFound;
        ManifestFound = manifestFound;
    }

    public RunExportAuthorityMaterial? Material { get; }

    public bool RunFound { get; }

    public bool ManifestFound { get; }

    public static RunExportAuthorityMaterialLoadResult Success(RunExportAuthorityMaterial material)
    {
        ArgumentNullException.ThrowIfNull(material);

        return new RunExportAuthorityMaterialLoadResult(material, runFound: true, manifestFound: true);
    }

    public static RunExportAuthorityMaterialLoadResult RunNotFound() =>
        new(material: null, runFound: false, manifestFound: false);

    public static RunExportAuthorityMaterialLoadResult ManifestNotFound() =>
        new(material: null, runFound: true, manifestFound: false);
}
