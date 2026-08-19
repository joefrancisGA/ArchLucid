using ArchLucid.Contracts.Manifest;

using Microsoft.AspNetCore.Http;

namespace ArchLucid.Application.Import;

public interface IArchitectureDefinitionCsvImportDryRunService
{
    /// <summary>
    ///     Parses a UTF-8 CSV (columns ComponentName, Type, Description), maps rows to <see cref="GoldenManifest" />,
    ///     and returns a dry-run preview (no persistence).
    /// </summary>
    Task<ArchitectureDefinitionCsvImportDryRunResult> ImportDryRunAsync(
        IFormFile? file,
        string? systemName,
        CancellationToken cancellationToken);
}
