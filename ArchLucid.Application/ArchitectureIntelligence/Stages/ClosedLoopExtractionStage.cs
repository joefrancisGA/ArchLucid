using System.Text;

using ArchLucid.Contracts.ArchitectureIntelligence;
using ArchLucid.Core.Concurrency;

namespace ArchLucid.Application.ArchitectureIntelligence.Stages;

public sealed class ClosedLoopExtractionStage(
    IImmutableSourceStore sourceStore,
    IArchitectureOntologyService ontologyService,
    IAsyncArchitectureExtractionService extractionService,
    ClosedLoopModelPersistenceHelper persistenceHelper) : IClosedLoopExtractionStage
{
    private const int ExtractionMaxConcurrent = 4;

    private readonly IImmutableSourceStore _sourceStore =
        sourceStore ?? throw new ArgumentNullException(nameof(sourceStore));

    private readonly IArchitectureOntologyService _ontologyService =
        ontologyService ?? throw new ArgumentNullException(nameof(ontologyService));

    private readonly IAsyncArchitectureExtractionService _extractionService =
        extractionService ?? throw new ArgumentNullException(nameof(extractionService));

    private readonly ClosedLoopModelPersistenceHelper _persistenceHelper =
        persistenceHelper ?? throw new ArgumentNullException(nameof(persistenceHelper));

    public async Task ExecuteAsync(ClosedLoopStageContext context, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(context);

        ClosedLoopReasoningRequest effectiveRequest = context.EffectiveRequest;
        string tenantId = context.TenantId;
        string runId = context.RunId;

        if (effectiveRequest.ContinueFromExistingRun
            && !string.IsNullOrWhiteSpace(runId))
        {
            ArchitectureKnowledgeModel? existing =
                await _persistenceHelper.TryLoadExistingModelAsync(tenantId, runId, cancellationToken);

            if (existing is null)
            {
                throw new InvalidOperationException(
                    $"No ArchitectureIntelligence model found for run '{runId}'.");
            }

            context.Model = ArchitectureKnowledgeModelCloner.Clone(existing);
            context.HadPersistedModelForRun = true;

            if (effectiveRequest.SourceTexts.Count > 0)
            {
                await AppendSourceTextsToModelAsync(context, cancellationToken);
            }
        }
        else
        {
            if (!string.IsNullOrWhiteSpace(effectiveRequest.RunId))
            {
                ArchitectureKnowledgeModel? existingForRun =
                    await _persistenceHelper.TryLoadExistingModelAsync(tenantId, runId, cancellationToken);

                context.HadPersistedModelForRun = existingForRun is not null;
            }

            context.StoredArtifactIds = await StoreSourcesAsync(effectiveRequest, tenantId, cancellationToken);
            context.Model = await BuildModelAsync(
                effectiveRequest,
                tenantId,
                runId,
                context.StoredArtifactIds,
                cancellationToken);
        }

        context.Model.RunId = runId;
        context.Model.DeclaredPriorities = effectiveRequest.DeclaredPriorities.Count > 0
            ? effectiveRequest.DeclaredPriorities.ToList()
            : context.Model.DeclaredPriorities.ToList();
    }

    private async Task<List<string>> StoreSourcesAsync(
        ClosedLoopReasoningRequest request,
        string tenantId,
        CancellationToken cancellationToken)
    {
        List<string> artifactIds = [];

        foreach (ClosedLoopReasoningSourceText sourceText in request.SourceTexts)
        {
            string artifactId = $"{ArchitectureIntelligenceArtifactPrefixes.KnownArtifactIdPrefix}{Guid.NewGuid():N}";
            ImmutableSourceArtifact artifact = new()
            {
                ArtifactId = artifactId,
                TenantId = tenantId,
                ContentType = sourceText.ContentType,
                FileName = sourceText.FileName,
                OwnershipClass = ArtifactOwnershipClass.Managed,
                CreatedUtc = TimeProvider.System.GetUtcNow().UtcDateTime,
                Version = "1",
            };

            byte[] content = Encoding.UTF8.GetBytes(sourceText.Content ?? string.Empty);
            await _sourceStore.StoreAsync(artifact, content, cancellationToken);
            artifactIds.Add(artifactId);
        }

        return artifactIds;
    }

    private async Task<ArchitectureKnowledgeModel> BuildModelAsync(
        ClosedLoopReasoningRequest request,
        string tenantId,
        string runId,
        List<string> artifactIds,
        CancellationToken cancellationToken)
    {
        ArchitectureKnowledgeModel model = _ontologyService.CreateEmptyModel(tenantId, runId);

        if (request.SourceTexts.Count > 0)
        {
            IReadOnlyList<int> indexes = Enumerable.Range(0, request.SourceTexts.Count).ToList();
            ArchitectureModelElement[][] extractedBatches = await BoundedParallelMap.MapAsync(
                indexes,
                ExtractionMaxConcurrent,
                async (index, ct) =>
                {
                    ClosedLoopReasoningSourceText sourceText = request.SourceTexts[index];
                    string artifactId = artifactIds[index];
                    IReadOnlyList<ArchitectureModelElement> extracted = await _extractionService.ExtractAsync(
                        sourceText.Content,
                        artifactId,
                        ct);

                    return extracted.ToArray();
                },
                cancellationToken);

            foreach (ArchitectureModelElement[] extracted in extractedBatches)
            {
                foreach (ArchitectureModelElement element in extracted)
                {
                    model = _ontologyService.UpsertElement(model, element);
                }
            }
        }

        return model;
    }

    private async Task AppendSourceTextsToModelAsync(
        ClosedLoopStageContext context,
        CancellationToken cancellationToken)
    {
        ClosedLoopReasoningRequest request = context.EffectiveRequest;
        ArchitectureKnowledgeModel model = context.Model;

        if (request.SourceTexts.Count == 0)
            return;

        List<string> artifactIds = await StoreSourcesAsync(request, context.TenantId, cancellationToken);

        IReadOnlyList<int> indexes = Enumerable.Range(0, request.SourceTexts.Count).ToList();
        ArchitectureModelElement[][] extractedBatches = await BoundedParallelMap.MapAsync(
            indexes,
            ExtractionMaxConcurrent,
            async (index, ct) =>
            {
                ClosedLoopReasoningSourceText sourceText = request.SourceTexts[index];
                string artifactId = artifactIds[index];
                IReadOnlyList<ArchitectureModelElement> extracted = await _extractionService.ExtractAsync(
                    sourceText.Content,
                    artifactId,
                    ct);

                return extracted.ToArray();
            },
            cancellationToken);

        foreach (ArchitectureModelElement[] extracted in extractedBatches)
        {
            foreach (ArchitectureModelElement element in extracted)
            {
                model = _ontologyService.UpsertElement(model, element);
            }
        }

        context.Model = model;
    }
}
