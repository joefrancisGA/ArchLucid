using System.Text;

using ArchLucid.Contracts.Manifest;

using Microsoft.AspNetCore.Http;

namespace ArchLucid.Application.Import;

/// <summary>
///     CSV → <see cref="GoldenManifest" /> dry-run mapper (no persistence).
/// </summary>
public sealed class ArchitectureDefinitionCsvImportDryRunService : IArchitectureDefinitionCsvImportDryRunService
{
    /// <summary>Maximum accepted upload size for CSV architecture imports (multipart body budget).</summary>
    public const long MaxUploadBytes = 1024 * 1024;

    public async Task<ArchitectureDefinitionCsvImportDryRunResult> ImportDryRunAsync(
        IFormFile? file,
        string? systemName,
        CancellationToken cancellationToken)
    {

        if (file is null || file.Length == 0)
            return Fail("No file uploaded.");

        if (file.Length > MaxUploadBytes)
            return Fail($"File exceeds maximum size ({MaxUploadBytes} bytes).");

        await using Stream stream = file.OpenReadStream();

        using StreamReader reader = new(stream, Encoding.UTF8, detectEncodingFromByteOrderMarks: true);
        string text = await reader.ReadToEndAsync(cancellationToken).ConfigureAwait(false);

        if (!ArchitectureCsvDryRunParser.TryParseRows(text, out List<ArchitectureCsvComponentRow> rows, out string? parseError))
            return Fail(parseError ?? "Could not parse CSV.");

        string runId = Guid.NewGuid().ToString("D");
        string resolvedSystemName =
            string.IsNullOrWhiteSpace(systemName) ? "csv-architecture-import" : systemName.Trim();

        GoldenManifest manifest = ArchitectureCsvToGoldenManifestDryRunMapper.Build(rows, runId, resolvedSystemName);

        return new ArchitectureDefinitionCsvImportDryRunResult
        {
            Succeeded = true,
            Manifest = manifest,
        };
    }

    private static ArchitectureDefinitionCsvImportDryRunResult Fail(string detail)
    {
        return new ArchitectureDefinitionCsvImportDryRunResult
        {
            Succeeded = false,
            FailureDetail = detail,
        };
    }
}
