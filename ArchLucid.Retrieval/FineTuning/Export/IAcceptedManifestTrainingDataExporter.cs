using ArchLucid.Core.Manifest;
using ArchLucid.Core.Scoping;
using ArchLucid.Retrieval.FineTuning.Consent;
using ArchLucid.Retrieval.FineTuning.Models;
using ArchLucid.Retrieval.FineTuning.Redaction;

namespace ArchLucid.Retrieval.FineTuning.Export;

/// <summary>Exports redaction-safe training records from accepted manifests in scope.</summary>
public interface IAcceptedManifestTrainingDataExporter
{
    Task<FineTuningTrainingExportResult> ExportAsync(
        ScopeContext scope,
        IReadOnlyList<ManifestDocument> manifests,
        CancellationToken cancellationToken);
}
