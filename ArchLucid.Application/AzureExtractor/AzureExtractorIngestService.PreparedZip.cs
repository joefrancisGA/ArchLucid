using ArchLucid.Application.AzureExtractor.Stages;

using Microsoft.AspNetCore.Http;

namespace ArchLucid.Application.AzureExtractor;

public sealed partial class AzureExtractorIngestService
{
    private async Task<AzureExtractorIngestResult> IngestPreparedZipAsync(
        byte[] zipBytes, string safeName, Guid? runId, string? correlationId, long maxAcceptedZipBytes, CancellationToken ct)
    {
        AzureExtractorPreparedZipValidateResult validation = await preparedZipValidateStage.ValidateAsync(zipBytes, safeName, runId, correlationId, maxAcceptedZipBytes, ct);
        if (validation.Failure is not null) return validation.Failure;
        return await preparedZipPersistStage.PersistAsync(validation.Context!, ct);
    }

    private static string NormalizeZipFileName(string? fileName)
    {
        string safeName = string.IsNullOrWhiteSpace(fileName) ? "package.zip" : Path.GetFileName(fileName.Trim());
        if (safeName.Length > 400) safeName = safeName[..400];
        if (!string.Equals(Path.GetExtension(safeName), ".zip", StringComparison.OrdinalIgnoreCase)) safeName += ".zip";
        return safeName;
    }

    private static async Task<byte[]> ReadCappedZipAsync(IFormFile file, CancellationToken ct)
    {
        await using Stream stream = file.OpenReadStream();
        using MemoryStream ms = new((int)Math.Min(file.Length, MaxUploadedZipBytes));
        byte[] buffer = new byte[8192];
        long total = 0;
        while (true)
        {
            int read = await stream.ReadAsync(buffer.AsMemory(0, buffer.Length), ct);
            if (read == 0) break;
            total += read;
            if (total > MaxUploadedZipBytes) throw new InvalidOperationException($"ZIP exceeds maximum size of {MaxUploadedZipBytes} bytes.");
            ms.Write(buffer, 0, read);
        }
        return ms.ToArray();
    }
}
