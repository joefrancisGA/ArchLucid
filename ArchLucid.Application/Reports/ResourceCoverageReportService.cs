using System.IO.Compression;
using System.Text.Json;

using ArchLucid.Contracts.Reports;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Models;

namespace ArchLucid.Application.Reports;

/// <summary>Builds provider-type coverage from the latest scoped Azure extractor ZIP.</summary>
public sealed class ResourceCoverageReportService(
    IScopeContextProvider scopeContextProvider,
    IAzureExtractorPackageRepository packageRepository)
{
    private readonly IScopeContextProvider _scopeContextProvider =
        scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    private readonly IAzureExtractorPackageRepository _packageRepository =
        packageRepository ?? throw new ArgumentNullException(nameof(packageRepository));

    public async Task<ResourceCoverageReportResponse> BuildAsync(CancellationToken cancellationToken = default)
    {
        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        AzureExtractorPackageDownloadRecord? download =
            await _packageRepository.TryGetLatestDownloadInScopeAsync(scope, cancellationToken).ConfigureAwait(false);

        if (download is null || download.PackageBytes.Length == 0)
            return new ResourceCoverageReportResponse();

        string? resourcesJson = TryReadResourcesJson(download.PackageBytes);

        if (string.IsNullOrWhiteSpace(resourcesJson))
            return new ResourceCoverageReportResponse();

        Dictionary<string, int> counts = new(StringComparer.OrdinalIgnoreCase);

        using JsonDocument document = JsonDocument.Parse(resourcesJson);

        if (document.RootElement.ValueKind is not JsonValueKind.Array)
            return new ResourceCoverageReportResponse();

        foreach (JsonElement row in document.RootElement.EnumerateArray())
        {
            if (!row.TryGetProperty("resourceType", out JsonElement typeElement))
                continue;

            string resourceType = typeElement.GetString()?.Trim() ?? string.Empty;

            if (string.IsNullOrWhiteSpace(resourceType))
                continue;

            counts.TryGetValue(resourceType, out int existing);
            counts[resourceType] = existing + 1;
        }

        List<ResourceCoverageRow> rows = counts
            .OrderByDescending(static pair => pair.Value)
            .ThenBy(static pair => pair.Key, StringComparer.OrdinalIgnoreCase)
            .Select(static pair => new ResourceCoverageRow { ResourceType = pair.Key, Count = pair.Value })
            .ToList();

        return new ResourceCoverageReportResponse { Rows = rows };
    }

    private static string? TryReadResourcesJson(byte[] packageBytes)
    {
        using MemoryStream stream = new(packageBytes);
        using ZipArchive archive = new(stream, ZipArchiveMode.Read, leaveOpen: false);
        ZipArchiveEntry? entry = archive.GetEntry("resources.json")
                               ?? archive.Entries.FirstOrDefault(static e =>
                                   e.Name.Equals("resources.json", StringComparison.OrdinalIgnoreCase));

        if (entry is null)
            return null;

        using StreamReader reader = new(entry.Open());
        return reader.ReadToEnd();
    }
}
