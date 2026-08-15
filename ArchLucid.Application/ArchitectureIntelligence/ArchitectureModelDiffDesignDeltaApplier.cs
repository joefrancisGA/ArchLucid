using ArchLucid.Contracts.ArchitectureIntelligence;

namespace ArchLucid.Application.ArchitectureIntelligence;

/// <summary>Applies design-element deltas from proposed recommendation text (TB-2338 item 39).</summary>
internal static class ArchitectureModelDiffDesignDeltaApplier
{
    internal static void ApplyDesignDeltas(
        ArchitectureKnowledgeModel afterModel,
        ArchitectureRecommendation recommendation,
        string recommendationElementId,
        List<ArchitectureModelDiffEntry> entries)
    {
        ArgumentNullException.ThrowIfNull(afterModel);
        ArgumentNullException.ThrowIfNull(recommendation);
        ArgumentNullException.ThrowIfNull(entries);

        string proposedChange = recommendation.ProposedChange ?? string.Empty;

        if (ContainsRecoverySignal(proposedChange))
        {
            AddDesignElement(
                afterModel,
                entries,
                recommendation,
                recommendationElementId,
                ArchitectureElementKind.Constraint,
                "Proposed recovery mechanism",
                proposedChange,
                "Proposed backup, replication, or failover aligned to stated RTO.");
        }

        if (ContainsAuthenticationSignal(proposedChange)
            && !afterModel.Elements.Any(element => element.Kind == ArchitectureElementKind.TrustBoundary))
        {
            AddDesignElement(
                afterModel,
                entries,
                recommendation,
                recommendationElementId,
                ArchitectureElementKind.TrustBoundary,
                "Proposed trust boundary",
                proposedChange,
                "Proposed trust boundary from authentication recommendation.");
        }

        if (ContainsAuthenticationSignal(proposedChange))
        {
            AddDesignElement(
                afterModel,
                entries,
                recommendation,
                recommendationElementId,
                ArchitectureElementKind.Constraint,
                "Proposed access control",
                proposedChange,
                "Proposed authentication and authorization control for exposed interfaces.");
        }

        if (ContainsCostCeilingSignal(proposedChange))
        {
            ApplyCostDriverCeilingMapping(afterModel, entries, recommendation, recommendationElementId, proposedChange);
        }

        if (ContainsCapacitySignal(proposedChange))
        {
            AddDesignElement(
                afterModel,
                entries,
                recommendation,
                recommendationElementId,
                ArchitectureElementKind.CapacityExpectation,
                "Proposed capacity expectation",
                proposedChange,
                "Proposed capacity or scale target from performance recommendation.");
        }

        if (ContainsDataFlowSignal(proposedChange))
        {
            AddDesignElement(
                afterModel,
                entries,
                recommendation,
                recommendationElementId,
                ArchitectureElementKind.DataFlow,
                "Proposed sensitive data flow",
                proposedChange,
                "Proposed data-flow documentation for sensitive data handling.");
        }

        if (ContainsComplianceSignal(proposedChange))
        {
            AddDesignElement(
                afterModel,
                entries,
                recommendation,
                recommendationElementId,
                ArchitectureElementKind.ComplianceObligation,
                "Proposed compliance obligation",
                proposedChange,
                "Proposed compliance obligation from privacy recommendation.");
        }
    }

    private static void ApplyCostDriverCeilingMapping(
        ArchitectureKnowledgeModel afterModel,
        List<ArchitectureModelDiffEntry> entries,
        ArchitectureRecommendation recommendation,
        string recommendationElementId,
        string proposedChange)
    {
        ArchitectureModelElement? costDriver = afterModel.Elements.FirstOrDefault(
            element => element.Kind == ArchitectureElementKind.CostDriver);

        if (costDriver is null)
        {
            AddDesignElement(
                afterModel,
                entries,
                recommendation,
                recommendationElementId,
                ArchitectureElementKind.CostDriver,
                "Proposed cost driver with ceiling mapping",
                proposedChange,
                "Proposed cost driver aligned to stated monthly ceiling.");

            return;
        }

        costDriver.Description = string.IsNullOrWhiteSpace(costDriver.Description)
            ? proposedChange
            : $"{costDriver.Description}; {proposedChange}";
        costDriver.RelatedElementIds.Add(recommendationElementId);
        costDriver.Properties["ceilingMapping"] = proposedChange;

        entries.Add(new ArchitectureModelDiffEntry
        {
            ElementId = costDriver.ElementId,
            ChangeKind = "Updated",
            ElementKind = ArchitectureElementKind.CostDriver,
            Description = "Updated cost driver to map spend to stated ceiling.",
        });
    }

    private static void AddDesignElement(
        ArchitectureKnowledgeModel afterModel,
        List<ArchitectureModelDiffEntry> entries,
        ArchitectureRecommendation recommendation,
        string recommendationElementId,
        ArchitectureElementKind kind,
        string name,
        string description,
        string diffDescription)
    {
        string elementId = Guid.NewGuid().ToString("N");
        afterModel.Elements.Add(new ArchitectureModelElement
        {
            ElementId = elementId,
            Kind = kind,
            Name = name,
            Description = description,
            ExtractionConfidence = recommendation.Confidence,
            RelatedElementIds = [recommendationElementId],
            Provenance = new ClaimProvenance
            {
                Origin = ClaimOrigin.SystemProposed,
                SupportStatus = SupportStatus.IndirectlySupported,
                Confidence = recommendation.Confidence,
                Notes = "Proposed by recommendation applier; not yet user-accepted.",
            },
        });

        entries.Add(new ArchitectureModelDiffEntry
        {
            ElementId = elementId,
            ChangeKind = "Added",
            ElementKind = kind,
            Description = diffDescription,
        });
    }

    private static bool ContainsRecoverySignal(string text)
    {
        return text.Contains("backup", StringComparison.OrdinalIgnoreCase)
            || text.Contains("replication", StringComparison.OrdinalIgnoreCase)
            || text.Contains("failover", StringComparison.OrdinalIgnoreCase)
            || text.Contains("rto", StringComparison.OrdinalIgnoreCase)
            || text.Contains("recovery", StringComparison.OrdinalIgnoreCase);
    }

    private static bool ContainsAuthenticationSignal(string text)
    {
        return text.Contains("authentication", StringComparison.OrdinalIgnoreCase)
            || text.Contains("authorization", StringComparison.OrdinalIgnoreCase)
            || text.Contains("trust boundary", StringComparison.OrdinalIgnoreCase);
    }

    private static bool ContainsCostCeilingSignal(string text)
    {
        return text.Contains("ceiling", StringComparison.OrdinalIgnoreCase)
            || text.Contains("cost driver", StringComparison.OrdinalIgnoreCase)
            || text.Contains("spend guardrail", StringComparison.OrdinalIgnoreCase);
    }

    private static bool ContainsCapacitySignal(string text)
    {
        return text.Contains("capacity", StringComparison.OrdinalIgnoreCase)
            || text.Contains("scale", StringComparison.OrdinalIgnoreCase)
            || text.Contains("throughput", StringComparison.OrdinalIgnoreCase);
    }

    private static bool ContainsDataFlowSignal(string text)
    {
        return text.Contains("data flow", StringComparison.OrdinalIgnoreCase)
            || text.Contains("data-flow", StringComparison.OrdinalIgnoreCase)
            || text.Contains("sensitive data", StringComparison.OrdinalIgnoreCase);
    }

    private static bool ContainsComplianceSignal(string text)
    {
        return text.Contains("compliance", StringComparison.OrdinalIgnoreCase)
            || text.Contains("gdpr", StringComparison.OrdinalIgnoreCase)
            || text.Contains("hipaa", StringComparison.OrdinalIgnoreCase)
            || text.Contains("jurisdiction", StringComparison.OrdinalIgnoreCase);
    }
}
