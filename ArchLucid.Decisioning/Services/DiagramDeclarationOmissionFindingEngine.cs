using ArchLucid.Contracts.Architecture;
using ArchLucid.Decisioning.Analysis;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Decisioning.Models;
using ArchLucid.KnowledgeGraph.Models;

namespace ArchLucid.Decisioning.Services;

/// <summary>
///     Emits contradiction findings when a completeness-asserting diagram omits a cited declaration (AS-042).
/// </summary>
public sealed class DiagramDeclarationOmissionFindingEngine : IFindingEngine
{
    public string EngineType => "diagram-declaration-omission";

    public string Category => "Topology";

    public Task<IReadOnlyList<Finding>> AnalyzeAsync(
        GraphSnapshot graphSnapshot,
        FindingAnalysisContext? analysisContext,
        CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(graphSnapshot);

        IReadOnlyList<DiagramDeclarationOmission> omissions =
            DiagramDeclarationOmissionAnalyzer.Analyze(graphSnapshot);

        if (omissions.Count == 0)
        {
            return Task.FromResult<IReadOnlyList<Finding>>([]);
        }

        List<Finding> findings = omissions.Select(BuildFinding).ToList();

        return Task.FromResult<IReadOnlyList<Finding>>(findings);
    }

    private static Finding BuildFinding(DiagramDeclarationOmission omission)
    {
        List<string> relatedNodeIds = [omission.DiagramParticipantNodeId, omission.OmittedDeclarationNodeId];

        return new Finding
        {
            FindingSchemaVersion = FindingsSchema.CurrentFindingVersion,
            FindingType = "DiagramDeclarationOmissionFinding",
            Category = "Topology",
            EngineType = "diagram-declaration-omission",
            Severity = FindingSeverity.Warning,
            Title = BuildTitle(omission),
            Rationale =
                $"Diagram participant '{omission.DiagramParticipantLabel}' cites '{omission.OmittedDeclarationLabel}' via '{omission.PropertyName}', but the explicit structured-diagram connector set does not include that declared resource.",
            DecisionConsequence =
                "Align the diagram connectors with cited declarations or correct the declaration reference before approval.",
            RelatedNodeIds = relatedNodeIds,
            PayloadType = nameof(DiagramDeclarationOmissionFindingPayload),
            Payload = new DiagramDeclarationOmissionFindingPayload
            {
                DiagramParticipantNodeId = omission.DiagramParticipantNodeId,
                OmittedDeclarationNodeId = omission.OmittedDeclarationNodeId,
                PropertyName = omission.PropertyName,
                ReferencedToken = omission.ReferencedToken,
                ReferenceKind = omission.ReferenceKind,
            },
            RecommendedActions =
            [
                "Add the cited declaration to the diagram connector set or update the declaration reference to match the drawn topology.",
            ],
            Trace = new ExplainabilityTrace
            {
                GraphNodeIdsExamined = relatedNodeIds,
                RulesApplied = ["diagram-declaration-omission"],
                DecisionsTaken =
                [
                    "Diagram asserted completeness via named trust boundary and explicit structured-parse connectors.",
                    "Cited declaration exists on the graph but is omitted from diagram topology participants.",
                ],
                Notes =
                [
                    $"evidence:graph-node:{omission.DiagramParticipantNodeId}",
                    $"evidence:graph-node:{omission.OmittedDeclarationNodeId}",
                ],
            },
        };
    }

    private static string BuildTitle(DiagramDeclarationOmission omission)
    {
        return omission.ReferenceKind switch
        {
            DanglingDeclarationReferenceKind.KeyVaultUri =>
                $"Diagram cites Key Vault '{omission.OmittedDeclarationLabel}' that is not in the explicit connector set",
            _ =>
                $"Diagram cites declaration '{omission.OmittedDeclarationLabel}' that is not in the explicit connector set",
        };
    }
}
