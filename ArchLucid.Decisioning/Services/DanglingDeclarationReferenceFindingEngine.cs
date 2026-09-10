using ArchLucid.Contracts.Architecture;
using ArchLucid.Decisioning.Analysis;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Decisioning.Models;
using ArchLucid.KnowledgeGraph.Models;

namespace ArchLucid.Decisioning.Services;

/// <summary>
///     Flags declaration property values that reference resources absent from this graph snapshot (DX-24).
/// </summary>
public sealed class DanglingDeclarationReferenceFindingEngine : IFindingEngine
{
    public string EngineType => "dangling-declaration-reference";

    public string Category => "Security";

    public Task<IReadOnlyList<Finding>> AnalyzeAsync(
        GraphSnapshot graphSnapshot,
        FindingAnalysisContext? analysisContext,
        CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(graphSnapshot);

        IReadOnlyList<DanglingDeclarationReference> references =
            DanglingDeclarationReferenceAnalyzer.Analyze(graphSnapshot);

        if (references.Count == 0)
        {
            return Task.FromResult<IReadOnlyList<Finding>>([]);
        }

        List<Finding> findings = references.Select(BuildFinding).ToList();

        return Task.FromResult<IReadOnlyList<Finding>>(findings);
    }

    private static Finding BuildFinding(DanglingDeclarationReference reference)
    {
        return new Finding
        {
            FindingSchemaVersion = FindingsSchema.CurrentFindingVersion,
            FindingType = "DanglingDeclarationReferenceFinding",
            Category = "Security",
            EngineType = "dangling-declaration-reference",
            Severity = FindingSeverity.Warning,
            Title = BuildTitle(reference),
            Rationale =
                $"Property '{reference.PropertyName}' on '{reference.SourceNodeLabel}' references '{reference.ReferencedToken}', which is not present in this review package graph.",
            DecisionConsequence =
                "Add the missing resource declaration to the package or correct the reference before approval.",
            RelatedNodeIds = [reference.SourceNodeId],
            PayloadType = nameof(DanglingDeclarationReferenceFindingPayload),
            Payload = new DanglingDeclarationReferenceFindingPayload
            {
                SourceNodeId = reference.SourceNodeId,
                PropertyName = reference.PropertyName,
                ReferencedToken = reference.ReferencedToken,
                ReferenceKind = reference.ReferenceKind,
            },
            RecommendedActions =
            [
                "Declare the referenced resource in this architecture package or update the property to point at an existing node.",
            ],
            Trace = new ExplainabilityTrace
            {
                GraphNodeIdsExamined = [reference.SourceNodeId],
                RulesApplied = ["dangling-declaration-reference"],
                DecisionsTaken =
                [
                    "Referenced token is not resolvable to any node id, label, or resource id on this snapshot.",
                ],
                Notes =
                [
                    $"evidence:graph-node:{reference.SourceNodeId}",
                ],
            },
        };
    }

    private static string BuildTitle(DanglingDeclarationReference reference)
    {
        return reference.ReferenceKind switch
        {
            DanglingDeclarationReferenceKind.KeyVaultUri =>
                $"Resource '{reference.SourceNodeLabel}' references Key Vault URI '{reference.ReferencedToken}' that is not declared in this package",
            DanglingDeclarationReferenceKind.Subnet =>
                $"Resource '{reference.SourceNodeLabel}' references subnet '{reference.ReferencedToken}' that is not declared in this package",
            DanglingDeclarationReferenceKind.Identity =>
                $"Resource '{reference.SourceNodeLabel}' references identity '{reference.ReferencedToken}' that is not declared in this package",
            _ =>
                $"Resource '{reference.SourceNodeLabel}' references ARM id '{reference.ReferencedToken}' that is not declared in this package",
        };
    }
}
