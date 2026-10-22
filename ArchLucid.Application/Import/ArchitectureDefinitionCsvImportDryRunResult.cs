using ArchLucid.Contracts.Manifest;

namespace ArchLucid.Application.Import;

/// <summary>Outcome of <see cref="IArchitectureDefinitionCsvImportDryRunService.ImportDryRunAsync" />.</summary>
public sealed class ArchitectureDefinitionCsvImportDryRunResult
{
    public bool Succeeded
    {
        get;
        init;
    }

    public GoldenManifest? Manifest
    {
        get;
        init;
    }

    public string? FailureDetail
    {
        get;
        init;
    }
}
