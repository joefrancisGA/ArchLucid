using System.Security.Cryptography;
using System.Text;

using ArchLucid.Core.Manifest;
using ArchLucid.Core.Scoping;
using ArchLucid.Retrieval.FineTuning.Consent;
using ArchLucid.Retrieval.FineTuning.Models;
using ArchLucid.Retrieval.FineTuning.Redaction;

using Microsoft.Extensions.Options;

namespace ArchLucid.Retrieval.FineTuning.Export;

/// <summary>Tenant-consent-aware, redaction-safe manifest training-data exporter (TB-594 Phase 1).</summary>
public sealed class AcceptedManifestTrainingDataExporter(
    IFineTuningConsentService consentService,
    IAcceptedManifestTrainingRedactor redactor,
    IOptionsMonitor<FineTuningOptions> options) : IAcceptedManifestTrainingDataExporter
{
    private readonly IFineTuningConsentService _consentService =
        consentService ?? throw new ArgumentNullException(nameof(consentService));

    private readonly IAcceptedManifestTrainingRedactor _redactor =
        redactor ?? throw new ArgumentNullException(nameof(redactor));

    private readonly IOptionsMonitor<FineTuningOptions> _options =
        options ?? throw new ArgumentNullException(nameof(options));

    /// <inheritdoc />
    public async Task<FineTuningTrainingExportResult> ExportAsync(
        ScopeContext scope,
        IReadOnlyList<ManifestDocument> manifests,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentNullException.ThrowIfNull(manifests);

        await _consentService.RequireExportConsentAsync(scope.TenantId, cancellationToken).ConfigureAwait(false);

        FineTuningConsentStatus consent = await _consentService
            .GetConsentAsync(scope.TenantId, cancellationToken)
            .ConfigureAwait(false);

        int maxManifests = Math.Max(1, _options.CurrentValue.MaxManifestsPerExport);
        List<ManifestDocument> scopedManifests = manifests
            .Where(m => m.TenantId == scope.TenantId
                        && m.WorkspaceId == scope.WorkspaceId
                        && m.ProjectId == scope.ProjectId)
            .Take(maxManifests)
            .ToList();

        List<FineTuningTrainingRecord> records = [];

        foreach (ManifestDocument manifest in scopedManifests)
        {
            IReadOnlyList<FineTuningTrainingRecord> built =
                AcceptedManifestTrainingExampleBuilder.BuildRecords(manifest, _redactor);

            records.AddRange(built);
        }

        string bundleHash = ComputeBundleHash(records);

        return new FineTuningTrainingExportResult
        {
            ManifestCount = scopedManifests.Count,
            Records = records,
            BundleContentHash = bundleHash,
            ConsentSnapshot = consent,
        };
    }

    private static string ComputeBundleHash(IReadOnlyList<FineTuningTrainingRecord> records)
    {
        StringBuilder builder = new();

        foreach (FineTuningTrainingRecord record in records.OrderBy(r => r.ManifestId))
            builder.Append(record.ContentHash);

        if (builder.Length == 0)
            return Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes("empty")));

        return Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(builder.ToString())));
    }
}
