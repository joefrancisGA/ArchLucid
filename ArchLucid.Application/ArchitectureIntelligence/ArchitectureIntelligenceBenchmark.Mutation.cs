using ArchLucid.Contracts.ArchitectureIntelligence;

namespace ArchLucid.Application.ArchitectureIntelligence;

public sealed partial class ArchitectureIntelligenceBenchmark
{
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
