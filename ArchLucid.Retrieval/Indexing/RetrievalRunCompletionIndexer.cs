using System.Diagnostics;

using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Models;
using ArchLucid.Provenance;
using ArchLucid.Retrieval.Models;

using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Retrieval.Graph;

namespace ArchLucid.Retrieval.Indexing;

/// <summary>
///     <see cref="IRetrievalRunCompletionIndexer" /> orchestration: <see cref="IRetrievalDocumentBuilder" /> (manifest,
///     artifacts, provenance) then <see cref="IRetrievalIndexingService" />.
/// </summary>
public sealed class RetrievalRunCompletionIndexer(
    IRetrievalDocumentBuilder documentBuilder,
    IRetrievalIndexingService indexingService,
    IGoldenManifestRepository goldenManifestRepository,
    Microsoft.Extensions.Options.IOptionsMonitor<PriorManifestRetrievalOptions> priorManifestOptions,
    IGraphCommunitySummarizationService graphCommunitySummarizationService)
    : IRetrievalRunCompletionIndexer
{
    private readonly IGraphCommunitySummarizationService _graphCommunitySummarizationService =
        graphCommunitySummarizationService ?? throw new ArgumentNullException(nameof(graphCommunitySummarizationService));

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
        GraphSnapshot? graphSnapshot,
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
            retrievalDocuments.AddRange(documentBuilder.BuildForFindings(
                tenantId,
                workspaceId,
                projectId,
                manifest.RunId,
                manifest.ManifestId,
                findingsSnapshot.Findings,
                findingsSnapshot.CreatedUtc));
        }

        if (graphSnapshot is not null)
        {
            retrievalDocuments.AddRange(
                KnowledgeGraphRetrievalDocumentBuilder.BuildFromGraphSnapshot(
                    graphSnapshot,
                    tenantId,
                    workspaceId,
                    projectId));

            IReadOnlyList<RetrievalDocument> communityDocuments =
                await _graphCommunitySummarizationService
                    .BuildCommunityDocumentsAsync(
                        graphSnapshot,
                        tenantId,
                        workspaceId,
                        projectId,
                        ct)
                    .ConfigureAwait(false);

            retrievalDocuments.AddRange(communityDocuments);
        }

        await indexingService.IndexDocumentsAsync(retrievalDocuments, ct);
    }
}
