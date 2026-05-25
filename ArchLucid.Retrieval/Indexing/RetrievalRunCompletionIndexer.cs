using System.Diagnostics;

using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Models;
using ArchLucid.Provenance;
using ArchLucid.Retrieval.Models;

namespace ArchLucid.Retrieval.Indexing;

/// <summary>
///     <see cref="IRetrievalRunCompletionIndexer" /> orchestration: <see cref="IRetrievalDocumentBuilder" /> (manifest,
///     artifacts, provenance) then <see cref="IRetrievalIndexingService" />.
/// </summary>
public sealed class RetrievalRunCompletionIndexer(
    IRetrievalDocumentBuilder documentBuilder,
    IRetrievalIndexingService indexingService,
    IGoldenManifestRepository goldenManifestRepository,
    Microsoft.Extensions.Options.IOptionsMonitor<PriorManifestRetrievalOptions> priorManifestOptions)
    : IRetrievalRunCompletionIndexer
{
    private readonly IGoldenManifestRepository _goldenManifestRepository =
        goldenManifestRepository ?? throw new ArgumentNullException(nameof(goldenManifestRepository));

    private readonly Microsoft.Extensions.Options.IOptionsMonitor<PriorManifestRetrievalOptions> _priorManifestOptions =
        priorManifestOptions ?? throw new ArgumentNullException(nameof(priorManifestOptions));

    /// <inheritdoc />
    public async Task IndexAuthorityRunAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        ManifestDocument manifest,
        IReadOnlyList<SynthesizedArtifact> artifacts,
        DecisionProvenanceGraph provenanceGraph,
        FindingsSnapshot? findingsSnapshot,
        CancellationToken ct)
    {
        using Activity? indexActivity = ArchLucidInstrumentation.RetrievalIndex.StartActivity();
        indexActivity?.SetTag("archlucid.run_id", manifest.RunId.ToString("D"));

        string logicalCorrelation =
            ActivityCorrelation.FindTagValueInChain(indexActivity?.Parent, ActivityCorrelation.LogicalCorrelationIdTag)
            ?? manifest.RunId.ToString("D");
        indexActivity?.SetTag(ActivityCorrelation.LogicalCorrelationIdTag, logicalCorrelation);

        List<RetrievalDocument> retrievalDocuments = [];
        retrievalDocuments.AddRange(documentBuilder.BuildForManifest(manifest));
        retrievalDocuments.AddRange(documentBuilder.BuildForArtifacts(
            tenantId,
            workspaceId,
            projectId,
            artifacts));
        retrievalDocuments.AddRange(documentBuilder.BuildForProvenance(
            tenantId,
            workspaceId,
            projectId,
            manifest.RunId,
            provenanceGraph));

        retrievalDocuments.AddRange(PriorManifestRetrievalDocumentBuilder.BuildFromManifest(
            manifest,
            findingsSnapshot?.CreatedUtc ?? manifest.CreatedUtc));

        ScopeContext scope = new()
        {
            TenantId = tenantId,
            WorkspaceId = workspaceId,
            ProjectId = projectId,
        };

        int maxPrior = Math.Max(0, _priorManifestOptions.CurrentValue.MaxPriorManifestsPerIndex);

        if (maxPrior > 0)
        {
            IReadOnlyList<ManifestDocument> priorManifests = await _goldenManifestRepository
                .ListPriorCommittedForRetrievalAsync(scope, manifest.RunId, maxPrior, ct)
                .ConfigureAwait(false);

            foreach (ManifestDocument prior in priorManifests)
            {
                retrievalDocuments.AddRange(PriorManifestRetrievalDocumentBuilder.BuildFromManifest(
                    prior,
                    prior.CreatedUtc));
            }
        }

        if (findingsSnapshot?.Findings is { Count: > 0 })
        {
            retrievalDocuments.AddRange(PriorManifestRetrievalDocumentBuilder.BuildFromFindings(
                tenantId,
                workspaceId,
                projectId,
                manifest.RunId,
                manifest.ManifestId,
                findingsSnapshot.Findings,
                findingsSnapshot.CreatedUtc));
        }

        await indexingService.IndexDocumentsAsync(retrievalDocuments, ct);
    }
}
