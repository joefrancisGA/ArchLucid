namespace ArchLucid.Application.Analysis;

/// <summary>Outcome of loading run export authority material.</summary>
public enum RunExportAuthorityMaterialLoadOutcome
{
    Success,
    RunNotFound,
    ManifestNotFound,
    SealedReceiptIncomplete,
    SealedReceiptHashMismatch,
}

/// <summary>Outcome of <see cref="IRunExportAuthorityMaterialLoader.LoadAsync" />.</summary>
public sealed class RunExportAuthorityMaterialLoadResult
{
    private RunExportAuthorityMaterialLoadResult(
        RunExportAuthorityMaterialLoadOutcome outcome,
        RunExportAuthorityMaterial? material)
    {
        Outcome = outcome;
        Material = material;
    }

    public RunExportAuthorityMaterialLoadOutcome Outcome { get; }

    public RunExportAuthorityMaterial? Material { get; }

    public bool RunFound => Outcome != RunExportAuthorityMaterialLoadOutcome.RunNotFound;

    public bool ManifestFound =>
        Outcome is RunExportAuthorityMaterialLoadOutcome.Success
            or RunExportAuthorityMaterialLoadOutcome.SealedReceiptIncomplete
            or RunExportAuthorityMaterialLoadOutcome.SealedReceiptHashMismatch;

    public static RunExportAuthorityMaterialLoadResult Success(RunExportAuthorityMaterial material)
    {
        ArgumentNullException.ThrowIfNull(material);

        return new RunExportAuthorityMaterialLoadResult(RunExportAuthorityMaterialLoadOutcome.Success, material);
    }

    public static RunExportAuthorityMaterialLoadResult RunNotFound() =>
        new(RunExportAuthorityMaterialLoadOutcome.RunNotFound, material: null);

    public static RunExportAuthorityMaterialLoadResult ManifestNotFound() =>
        new(RunExportAuthorityMaterialLoadOutcome.ManifestNotFound, material: null);

    public static RunExportAuthorityMaterialLoadResult SealedReceiptIncomplete() =>
        new(RunExportAuthorityMaterialLoadOutcome.SealedReceiptIncomplete, material: null);

    public static RunExportAuthorityMaterialLoadResult SealedReceiptHashMismatch() =>
        new(RunExportAuthorityMaterialLoadOutcome.SealedReceiptHashMismatch, material: null);
}
