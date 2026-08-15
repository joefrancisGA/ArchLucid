using ArchLucid.Contracts.ArchitectureIntelligence;

namespace ArchLucid.Application.ArchitectureIntelligence;

/// <summary>
/// TB-1990 benchmark pyramid: visible microcases, held-out microcases, and mutation tests.
/// Held-out definitions must not be used during prompt iteration.
/// </summary>
public sealed class ArchitectureIntelligenceBenchmark : IArchitectureIntelligenceBenchmark
{
    private readonly IExtractionFidelityBenchmark _extractionFidelityBenchmark;

    public ArchitectureIntelligenceBenchmark(IExtractionFidelityBenchmark extractionFidelityBenchmark)
    {
        _extractionFidelityBenchmark = extractionFidelityBenchmark
            ?? throw new ArgumentNullException(nameof(extractionFidelityBenchmark));
    }

    public IReadOnlyList<ExtractionFidelityCase> GetVisibleMicrocases()
    {
        return _extractionFidelityBenchmark.MicroCases
            .Where(c => !c.CaseId.StartsWith("holdout-", StringComparison.OrdinalIgnoreCase))
            .ToList();
    }

    public IReadOnlyList<ExtractionFidelityCase> GetHeldOutMicrocases()
    {
        return
        [
            new ExtractionFidelityCase
            {
                CaseId = "holdout-rpo-backup-mismatch",
                SourceText = "RPO is 15 minutes. Database backups run nightly only. No transaction log shipping.",
                ExpectedElementKinds = [ArchitectureElementKind.RecoveryObjective, ArchitectureElementKind.Constraint],
                ExpectedNames = ["Recovery objective", "backup"]
            },
            new ExtractionFidelityCase
            {
                CaseId = "holdout-intentional-tradeoff",
                SourceText = "We accept single-region deployment to reduce cost; regional outage risk is an approved trade-off.",
                ExpectedElementKinds = [ArchitectureElementKind.TradeOff, ArchitectureElementKind.Decision],
                ExpectedNames = ["trade-off", "Single-region"]
            }
        ];
    }

    public IReadOnlyList<BenchmarkMutation> GetMutationTests()
    {
        return
        [
            new BenchmarkMutation
            {
                MutationId = "mutate-rto-30m",
                Description = "Change RTO from four hours to 30 minutes.",
                ApplyDelta = "recovery-objective:RTO=30m"
            },
            new BenchmarkMutation
            {
                MutationId = "mutate-add-replication",
                Description = "Add replication evidence.",
                ApplyDelta = "add:evidence:replication-enabled"
            },
            new BenchmarkMutation
            {
                MutationId = "mutate-remove-trust-boundary",
                Description = "Remove a trust boundary.",
                ApplyDelta = "remove:TrustBoundary"
            },
            new BenchmarkMutation
            {
                MutationId = "mutate-data-regulated",
                Description = "Change data from public to regulated.",
                ApplyDelta = "data-classification:regulated"
            },
            new BenchmarkMutation
            {
                MutationId = "mutate-add-authentication",
                Description = "Add explicit authentication control evidence.",
                ApplyDelta = "add:authentication:required"
            },
            new BenchmarkMutation
            {
                MutationId = "mutate-remove-replication",
                Description = "Remove replication evidence.",
                ApplyDelta = "remove:replication"
            },
        ];
    }

    public IReadOnlyList<ArchitectureIntelligenceDeepCase> GetDeepCases()
    {
        List<ArchitectureIntelligenceDeepCase> deepCases =
        [
            new ArchitectureIntelligenceDeepCase
            {
                CaseId = GoldenIncompleteArchitectureFixture.DeepCaseId,
                Title = "Golden incomplete claims intake architecture",
                SourceText = GoldenIncompleteArchitectureFixture.Content,
                PlantedDefects = GoldenIncompleteArchitectureFixture.ExpectedPlantedDefects.ToList(),
                ExpectedMutationIds = ["mutate-rto-30m", "mutate-remove-trust-boundary"],
            },
        ];

        deepCases.AddRange(ArchitectureIntelligenceDeepCaseCatalog.GetAdditionalDeepCases());

        return deepCases;
    }

    public IReadOnlyList<CategoryBenchmarkScore> ScoreCategories(
        ArchitectureKnowledgeModel model,
        IReadOnlyList<SpecialistReviewFinding> findings,
        IReadOnlyList<ArchitectureRecommendation> recommendations,
        double plantedDefectRecall,
        bool mutationChangedFindings)
    {
        ArgumentNullException.ThrowIfNull(model);
        ArgumentNullException.ThrowIfNull(findings);
        ArgumentNullException.ThrowIfNull(recommendations);

        double extraction = model.Elements.Count == 0 ? 0.0 : Math.Min(1.0, model.Elements.Count / 6.0);
        int constructionSignal = model.Elements.Count(element =>
            element.Kind is ArchitectureElementKind.Component
                or ArchitectureElementKind.Decision
                or ArchitectureElementKind.QualityAttribute
                or ArchitectureElementKind.FunctionalRequirement);
        double construction = Math.Min(1.0, constructionSignal / 4.0);
        double review = Math.Clamp(plantedDefectRecall, 0.0, 1.0);
        double enhancement = Math.Min(
            1.0,
            (recommendations.Count > 0 ? 0.5 : 0.0) + (mutationChangedFindings ? 0.5 : 0.0));

        return
        [
            new CategoryBenchmarkScore
            {
                Category = BenchmarkScoreCategory.Extraction,
                Score = extraction,
                Detail = $"{model.Elements.Count} elements.",
            },
            new CategoryBenchmarkScore
            {
                Category = BenchmarkScoreCategory.Construction,
                Score = construction,
                Detail = $"{constructionSignal} construction signals.",
            },
            new CategoryBenchmarkScore
            {
                Category = BenchmarkScoreCategory.Review,
                Score = review,
                Detail = $"{findings.Count} findings; planted recall {plantedDefectRecall:0.00}.",
            },
            new CategoryBenchmarkScore
            {
                Category = BenchmarkScoreCategory.Enhancement,
                Score = enhancement,
                Detail = $"{recommendations.Count} recommendations; mutationChanged={mutationChangedFindings}.",
            },
        ];
    }

    public IReadOnlyList<ExtractionFidelityScore> ScoreExtraction(IDifficultyBasedExtractionRouter router)
    {
        ArgumentNullException.ThrowIfNull(router);

        // Visible cases only — held-out cases must not drive iteration scores.
        return _extractionFidelityBenchmark.Score(router);
    }

    public IReadOnlyList<ExtractionFidelityScore> ScoreHeldOutExtraction(IDifficultyBasedExtractionRouter router)
    {
        ArgumentNullException.ThrowIfNull(router);

        return _extractionFidelityBenchmark.ScoreCases(router, GetHeldOutMicrocases());
    }

    public bool MutationChangesFindings(
        ArchitectureKnowledgeModel beforeModel,
        BenchmarkMutation mutation,
        ISpecialistReviewService specialistReviewService)
    {
        ArgumentNullException.ThrowIfNull(beforeModel);
        ArgumentNullException.ThrowIfNull(mutation);
        ArgumentNullException.ThrowIfNull(specialistReviewService);

        if (string.IsNullOrWhiteSpace(mutation.ApplyDelta))
        {
            throw new ArgumentException("ApplyDelta is required.", nameof(mutation));
        }

        SpecialistReviewResult before = specialistReviewService.Review(beforeModel);
        int beforeCount = before.Findings.Count;

        ArchitectureKnowledgeModel afterModel = CloneModel(beforeModel);
        ApplyMutation(afterModel, mutation.ApplyDelta);

        SpecialistReviewResult after = specialistReviewService.Review(afterModel);
        int afterCount = after.Findings.Count;

        // Mutation tests verify the system reasons from inputs rather than emitting static commentary.
        return beforeCount != afterCount
            || !FindingsSignature(before).Equals(FindingsSignature(after), StringComparison.Ordinal);
    }

    private static ArchitectureKnowledgeModel CloneModel(ArchitectureKnowledgeModel source)
    {
        return new ArchitectureKnowledgeModel
        {
            ModelId = source.ModelId,
            TenantId = source.TenantId,
            RunId = source.RunId,
            SchemaVersion = source.SchemaVersion,
            CreatedUtc = source.CreatedUtc,
            UpdatedUtc = source.UpdatedUtc,
            Elements = source.Elements
                .Select(e => new ArchitectureModelElement
                {
                    ElementId = e.ElementId,
                    Kind = e.Kind,
                    Name = e.Name,
                    Description = e.Description,
                    Provenance = e.Provenance,
                    ExtractionConfidence = e.ExtractionConfidence,
                    SourcePassageIds = [.. e.SourcePassageIds],
                    RelatedElementIds = [.. e.RelatedElementIds],
                    Properties = new Dictionary<string, string>(e.Properties),
                    LifecycleScope = e.LifecycleScope,
                })
                .ToList(),
            DeclaredPriorities = [.. source.DeclaredPriorities],
            FramingAnswers = new Dictionary<string, string>(source.FramingAnswers)
        };
    }

    private static void ApplyMutation(ArchitectureKnowledgeModel model, string applyDelta)
    {
        if (applyDelta.StartsWith("recovery-objective:", StringComparison.OrdinalIgnoreCase))
        {
            ArchitectureModelElement? existing = model.Elements
                .FirstOrDefault(e => e.Kind == ArchitectureElementKind.RecoveryObjective);

            if (existing is null)
            {
                model.Elements.Add(new ArchitectureModelElement
                {
                    ElementId = Guid.NewGuid().ToString("N"),
                    Kind = ArchitectureElementKind.RecoveryObjective,
                    Name = applyDelta,
                    ExtractionConfidence = 1.0,
                    Provenance = new ClaimProvenance
                    {
                        Origin = ClaimOrigin.UserAsserted,
                        SupportStatus = SupportStatus.DirectlyEstablished,
                        Confidence = 1.0
                    }
                });
            }
            else
            {
                existing.Name = applyDelta;
                existing.Description = applyDelta;
            }

            return;
        }

        if (applyDelta.StartsWith("add:evidence:", StringComparison.OrdinalIgnoreCase))
        {
            model.Elements.Add(new ArchitectureModelElement
            {
                ElementId = Guid.NewGuid().ToString("N"),
                Kind = ArchitectureElementKind.Evidence,
                Name = applyDelta,
                ExtractionConfidence = 1.0,
                Provenance = new ClaimProvenance
                {
                    Origin = ClaimOrigin.UserAsserted,
                    SupportStatus = SupportStatus.DirectlyEstablished,
                    Confidence = 1.0
                }
            });

            return;
        }

        if (applyDelta.StartsWith("remove:TrustBoundary", StringComparison.OrdinalIgnoreCase))
        {
            model.Elements.RemoveAll(e => e.Kind == ArchitectureElementKind.TrustBoundary);

            return;
        }

        if (applyDelta.StartsWith("data-classification:", StringComparison.OrdinalIgnoreCase))
        {
            model.Elements.Add(new ArchitectureModelElement
            {
                ElementId = Guid.NewGuid().ToString("N"),
                Kind = ArchitectureElementKind.ComplianceObligation,
                Name = applyDelta,
                ExtractionConfidence = 1.0,
                Provenance = new ClaimProvenance
                {
                    Origin = ClaimOrigin.UserAsserted,
                    SupportStatus = SupportStatus.DirectlyEstablished,
                    Confidence = 1.0
                }
            });

            return;
        }

        if (applyDelta.StartsWith("add:authentication:", StringComparison.OrdinalIgnoreCase))
        {
            model.Elements.Add(new ArchitectureModelElement
            {
                ElementId = Guid.NewGuid().ToString("N"),
                Kind = ArchitectureElementKind.TrustBoundary,
                Name = "Authentication required",
                Description = applyDelta,
                ExtractionConfidence = 1.0,
                Properties = new Dictionary<string, string> { ["authentication"] = "required" },
                Provenance = new ClaimProvenance
                {
                    Origin = ClaimOrigin.UserAsserted,
                    SupportStatus = SupportStatus.DirectlyEstablished,
                    Confidence = 1.0
                }
            });

            return;
        }

        if (applyDelta.StartsWith("remove:replication", StringComparison.OrdinalIgnoreCase))
        {
            model.Elements.RemoveAll(element =>
                element.Name.Contains("replication", StringComparison.OrdinalIgnoreCase));

            return;
        }
    }

    private static string FindingsSignature(SpecialistReviewResult result)
    {
        return string.Join(
            "|",
            result.Findings
                .Select(f => $"{f.Dimension}:{f.Title}:{f.Conclusion}:{f.EvidenceCondition}")
                .OrderBy(s => s, StringComparer.Ordinal));
    }
}
