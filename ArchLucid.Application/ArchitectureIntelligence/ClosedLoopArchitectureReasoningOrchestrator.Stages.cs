using System.Text;
using ArchLucid.Contracts.ArchitectureIntelligence;
using ArchLucid.Contracts.Persistence.TechnologyLedger;
using ArchLucid.Core.Concurrency;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Application.ArchitectureIntelligence;

public sealed partial class ClosedLoopArchitectureReasoningOrchestrator
{
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
        ArchitectureKnowledgeModel model,
        ClosedLoopReasoningRequest request,
        string tenantId,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(model);
        ArgumentNullException.ThrowIfNull(request);

        if (request.SourceTexts.Count == 0)
            return;

        List<string> artifactIds = await StoreSourcesAsync(request, tenantId, cancellationToken);

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

    private async Task<List<SpecialistReviewResult>> RunSpecialistReviewsAsync(
        ArchitectureKnowledgeModel model,
        IReadOnlyList<string> declaredPriorities,
        CancellationToken cancellationToken)
    {
        QualityDimension[] dimensions = DeclaredPrioritySpecialistDepthSelector
            .SelectDimensions(declaredPriorities)
            .ToArray();

        SpecialistReviewResult[] reviews = await BoundedParallelMap.MapAsync(
            dimensions,
            SpecialistReviewMaxConcurrent,
            async (dimension, ct) =>
            {
                SpecialistReviewResult dimensionResult = await _specialistReviewService.ReviewAsync(
                    model,
                    [dimension],
                    ct);
                dimensionResult.Dimension = dimension;

                return dimensionResult;
            },
            cancellationToken);

        return reviews.ToList();
    }

    private async Task<List<EvidenceValidationResult>> ValidateFindingsAsync(
        IReadOnlyList<SpecialistReviewFinding> findings,
        CancellationToken cancellationToken)
    {
        if (findings.Count == 0)
            return [];

        EvidenceValidationResult[] validationResults = await BoundedParallelMap.MapAsync(
            findings,
            EvidenceValidationMaxConcurrent,
            async (finding, ct) =>
            {
                List<string> citedArtifactIds = finding.EvidenceArtifactIds
                    .Where(id => !string.IsNullOrWhiteSpace(id))
                    .Distinct(StringComparer.Ordinal)
                    .ToList();

                List<string> citedQuotes = [];

                if (finding.Provenance.PassageLocator is not null
                    && !string.IsNullOrWhiteSpace(finding.Provenance.PassageLocator.Quote))
                {
                    citedQuotes.Add(finding.Provenance.PassageLocator.Quote);
                }

                citedQuotes = EvidenceValidationSourceReread.AugmentCitedQuotesForHighSeverity(
                    finding,
                    citedQuotes,
                    _sourceStore);

                string claimedConclusion = $"{finding.Conclusion}:{finding.Severity}:{finding.Title}";

                return await _evidenceValidationPipeline.ValidateAsync(
                    finding.FindingId,
                    citedArtifactIds,
                    citedQuotes,
                    _sourceStore,
                    claimedConclusion,
                    ct);
            },
            cancellationToken);

        return validationResults.ToList();
    }

    private async Task<IReadOnlyList<TechnologyLedgerEntry>?> TryLoadLedgerEntriesAsync(
        string runId,
        CancellationToken cancellationToken)
    {
        if (_technologyLedgerRepository is null
            || _scopeContextProvider is null
            || string.IsNullOrWhiteSpace(runId))
        {
            return null;
        }

        try
        {
            ScopeContext scope = _scopeContextProvider.GetCurrentScope();

            return await _technologyLedgerRepository
                .GetByRunIdAsync(scope, runId, cancellationToken)
                .ConfigureAwait(false);
        }
        catch (Exception) when (cancellationToken.IsCancellationRequested)
        {
            throw;
        }
        catch (Exception)
        {
            return null;
        }
    }

    private static void MergeAdversarialChallengesIntoModel(
        ArchitectureKnowledgeModel model,
        AdversarialReviewResult adversarial)
    {
        foreach (AdversarialChallenge challenge in adversarial.Challenges)
        {
            if (challenge.Suppressed)
            {
                continue;
            }

            model.Elements.Add(new ArchitectureModelElement
            {
                ElementId = challenge.ChallengeId,
                Kind = ArchitectureElementKind.UnresolvedQuestion,
                Name = challenge.Hypothesis,
                Description = challenge.FalsificationEvidenceNeeded,
                ExtractionConfidence = challenge.Confidence,
                Provenance = new ClaimProvenance
                {
                    Origin = ClaimOrigin.SystemProposed,
                    SupportStatus = SupportStatus.NotYetEvaluated,
                    Confidence = challenge.Confidence,
                    Notes = "Adversarial challenge lane; not a substantiated finding.",
                },
            });
        }
    }

    private static string RequireTenantId(ClosedLoopReasoningRequest request)
    {
        string tenantId = request.TenantId?.Trim() ?? string.Empty;

        if (string.IsNullOrWhiteSpace(tenantId))
        {
            throw new ArgumentException("TenantId is required.", nameof(request));
        }

        return tenantId;
    }

    private async Task<ArchitectureKnowledgeModel?> TryLoadExistingModelAsync(
        string tenantId,
        string runId,
        CancellationToken cancellationToken)
    {
        if (_knowledgeModelAccess is not null
            && _scopeContextProvider is not null
            && Guid.TryParse(runId, out Guid parsedRunId))
        {
            ScopeContext scope = _scopeContextProvider.GetCurrentScope();

            return await _knowledgeModelAccess
                .GetForRunAsync(scope, parsedRunId, cancellationToken)
                .ConfigureAwait(false);
        }

        if (_persistence is null)
            return null;

        return await _persistence
            .GetModelByRunIdAsync(tenantId, runId, cancellationToken)
            .ConfigureAwait(false);
    }

    private async Task SaveModelAsync(
        string? runId,
        ArchitectureKnowledgeModel model,
        CancellationToken cancellationToken)
    {
        if (_knowledgeModelAccess is not null
            && _scopeContextProvider is not null
            && !string.IsNullOrWhiteSpace(runId)
            && Guid.TryParse(runId, out Guid parsedRunId))
        {
            ScopeContext scope = _scopeContextProvider.GetCurrentScope();
            await _knowledgeModelAccess.SaveForRunAsync(scope, parsedRunId, model, cancellationToken)
                .ConfigureAwait(false);

            return;
        }

        if (_persistence is not null)
            await _persistence.SaveModelAsync(model, cancellationToken).ConfigureAwait(false);
    }
}
