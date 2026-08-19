using System.Text;

using ArchLucid.AgentRuntime.PromptInjection;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Evidence;
using ArchLucid.Retrieval.Pricing;

namespace ArchLucid.AgentRuntime.Prompts;

/// <summary>
///     Composes agent user prompts with static prefix before per-run dynamic sections (TB-681).
///     Customer prose is quarantined via <see cref="CustomerContentPromptDelimiters" /> (TB-949).
/// </summary>
public static class AgentUserPromptComposer
{
    /// <summary>Marker line for ordering tests — first dynamic run field.</summary>
    public const string RunHeaderMarker = "RunId:";

    /// <summary>Marker for static guidance block.</summary>
    public const string ImportantGuidanceMarker = "Important guidance:";

    /// <summary>Marker for architecture/evidence section.</summary>
    public const string ArchitectureRequestMarker = "Architecture Request";

    /// <summary>Topology agent user prompt (static prefix before run/evidence).</summary>
    public static string BuildTopologyUserPrompt(
        string runId,
        ArchitectureRequest request,
        AgentEvidencePackage evidence,
        AgentTask task,
        CloudProvider effectiveCloudTarget)
    {
        StringBuilder sb = new();

        AgentUserPromptStaticPrefix.AppendTopology(sb, effectiveCloudTarget);
        AgentUserPromptBuilder.AppendRunHeader(sb, runId, task.TaskId, "Topology");
        AgentUserPromptBuilder.AppendArchitectureRequestAndEvidence(sb, request, evidence);
        AgentUserPromptBuilder.AppendTaskObjectiveToolsAndSources(sb, task);

        return sb.ToString();
    }

    /// <summary>Compliance agent user prompt (static prefix before run/evidence).</summary>
    public static string BuildComplianceUserPrompt(
        string runId,
        ArchitectureRequest request,
        AgentEvidencePackage evidence,
        AgentTask task,
        CloudProvider effectiveCloudTarget)
    {
        StringBuilder sb = new();

        AgentUserPromptStaticPrefix.AppendCompliance(sb, effectiveCloudTarget);
        AgentUserPromptBuilder.AppendRunHeader(sb, runId, task.TaskId, "Compliance");
        AgentUserPromptBuilder.AppendArchitectureRequestAndEvidence(sb, request, evidence);
        AgentUserPromptBuilder.AppendTaskObjectiveToolsAndSources(sb, task);

        return sb.ToString();
    }

    /// <summary>Cost agent user prompt (static prefix before run/evidence).</summary>
    public static string BuildCostUserPrompt(
        string runId,
        ArchitectureRequest request,
        AgentEvidencePackage evidence,
        AgentTask task,
        CloudProvider effectiveCloudTarget,
        CostRetailGroundingResult grounding)
    {
        StringBuilder sb = new();

        AgentUserPromptStaticPrefix.AppendCost(sb, effectiveCloudTarget);
        AgentUserPromptBuilder.AppendRunHeader(sb, runId, task.TaskId, "Cost");
        AgentUserPromptBuilder.AppendArchitectureRequestAndEvidence(sb, request, evidence);
        AgentUserPromptBuilder.AppendTaskObjectiveToolsAndSources(sb, task);

        if (!grounding.SkippedRetailGrounding)
        {
            sb.AppendLine();
            sb.AppendLine(grounding.PromptBlock);
        }

        return sb.ToString();
    }

    /// <summary>Critic agent user prompt (static prefix before run/evidence).</summary>
    public static string BuildCriticUserPrompt(
        string runId,
        ArchitectureRequest request,
        AgentEvidencePackage evidence,
        AgentTask task,
        CloudProvider effectiveCloudTarget)
    {
        StringBuilder sb = new();

        AgentUserPromptStaticPrefix.AppendCritic(sb, effectiveCloudTarget);
        AgentUserPromptBuilder.AppendRunHeader(sb, runId, task.TaskId, "Critic");
        AgentUserPromptBuilder.AppendArchitectureRequestAndEvidence(sb, request, evidence);

        List<EvidenceNote> stagedNotes = evidence.Notes
            .Where(static n => EvidenceNoteTypes.StagedPriorAgentsSummary.Equals(
                n.NoteType,
                StringComparison.Ordinal))
            .ToList();

        if (stagedNotes.Count > 0)
        {
            CustomerContentPromptDelimiters.AppendQuarantinedSection(
                sb,
                body => AppendStagedPriorAgentsSummary(body, stagedNotes));
        }

        AgentUserPromptBuilder.AppendTaskObjectiveToolsAndSources(sb, task);

        return sb.ToString();
    }

    private static void AppendStagedPriorAgentsSummary(StringBuilder sb, List<EvidenceNote> stagedNotes)
    {
        sb.AppendLine(
            "Prior agent batch summary (bounded, redacted; execution sequencing only — not autonomous planning "
            + "beyond product scope; see docs/library/V1_SCOPE.md):");
        sb.AppendLine();

        foreach (EvidenceNote staged in stagedNotes)
        {
            if (!string.IsNullOrWhiteSpace(staged.Message))
                sb.AppendLine(CustomerContentPromptDelimiters.EscapeEmbeddedMarkers(staged.Message));

            sb.AppendLine();
        }
    }
}
