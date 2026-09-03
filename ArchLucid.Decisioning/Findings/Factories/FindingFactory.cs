using ArchLucid.Contracts.Agents;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Decisioning.Models;
using ArchLucid.KnowledgeGraph.Models;

using ExplainabilityMarkers = ArchLucid.Decisioning.Findings.ExplainabilityTraceMarkers;

namespace ArchLucid.Decisioning.Findings.Factories;

public static class FindingFactory
{
    public static Finding CreateRequirementFinding(
        string engineType,
        string title,
        string rationale,
        string requirementName,
        string requirementText,
        bool isMandatory,
        IEnumerable<string>? relatedNodeIds = null)
        => RequirementFindingFactory.CreateRequirementFinding(
            engineType,
            title,
            rationale,
            requirementName,
            requirementText,
            isMandatory,
            relatedNodeIds);

    public static Finding CreateTopologyGapFinding(
        string engineType,
        string title,
        string rationale,
        string gapCode,
        string description,
        string impact,
        FindingSeverity severity = FindingSeverity.Warning,
        IEnumerable<string>? relatedNodeIds = null)
        => TopologyFindingFactory.CreateTopologyGapFinding(
            engineType,
            title,
            rationale,
            gapCode,
            description,
            impact,
            severity,
            relatedNodeIds);

    public static Finding CreateRequirementGapFinding(
        string engineType,
        string title,
        string rationale,
        string gapCode,
        string description,
        string impact,
        FindingSeverity severity = FindingSeverity.Warning,
        IEnumerable<string>? relatedNodeIds = null)
        => RequirementFindingFactory.CreateRequirementGapFinding(
            engineType,
            title,
            rationale,
            gapCode,
            description,
            impact,
            severity,
            relatedNodeIds);

    public static Finding CreateSecurityGapFinding(
        string engineType,
        string title,
        string rationale,
        string gapCode,
        string description,
        string impact,
        FindingSeverity severity = FindingSeverity.Warning,
        IEnumerable<string>? relatedNodeIds = null)
        => TopologyFindingFactory.CreateSecurityGapFinding(
            engineType,
            title,
            rationale,
            gapCode,
            description,
            impact,
            severity,
            relatedNodeIds);

    public static Finding CreatePolicyApplicabilityFinding(
        string engineType,
        GraphNode policyNode,
        string? policyReference,
        IReadOnlyList<string> applicableTopologyNodeIds,
        IReadOnlyList<string> graphNodeIdsExamined)
        => PolicyApplicabilityFindingFactory.CreatePolicyApplicabilityFinding(
            engineType,
            policyNode,
            policyReference,
            applicableTopologyNodeIds,
            graphNodeIdsExamined);

    public static Finding CreatePolicyApplicabilityGapFinding(
        string engineType,
        GraphNode policyNode,
        string? policyReference,
        string gapRationale)
        => PolicyApplicabilityFindingFactory.CreatePolicyApplicabilityGapFinding(
            engineType,
            policyNode,
            policyReference,
            gapRationale);

    /// <summary>
    ///     Maps an LLM <see cref="ArchitectureFinding" /> plus agent/execution metadata into a persisted-shaped
    ///     <see cref="Finding" />.
    /// </summary>
    public static Finding CreateFromAgentArchitectureFinding(
        ArchitectureFinding finding,
        AgentResult agentResult,
        AgentExecutionTrace? trace = null)
    {
        ArgumentNullException.ThrowIfNull(finding);
        ArgumentNullException.ThrowIfNull(agentResult);

        string? traceKey = trace?.TraceId;
        string agentExecutionTraceId;

        if (!string.IsNullOrEmpty(traceKey))
        {
            agentExecutionTraceId = traceKey.Length > 32 ? traceKey[..32] : traceKey;
        }
        else
        {
            string fid = finding.FindingId;
            agentExecutionTraceId = fid.Length > 32 ? fid[..32] : fid;
        }

        List<string> notes = finding.EvidenceRefs.ConvertAll(static r => $"evidence:{r}");
        List<string> citations = finding.EvidenceRefs
            .Where(static r => !string.IsNullOrWhiteSpace(r))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();
        (string? reasoningTrace, string? reasoningDigest) = ReasoningTraceBounds.Normalize(agentResult.ReasoningTrace);
        string agentRuleId = $"agent-{agentResult.AgentType}";
        string decisionSummary = $"Recorded architecture finding from {agentResult.AgentType} agent.";

        return new Finding
        {
            FindingSchemaVersion = FindingsSchema.CurrentFindingVersion,
            FindingId = finding.FindingId,
            FindingType = $"AgentArchitectureFinding-{agentResult.AgentType}",
            Category =
                string.IsNullOrWhiteSpace(finding.Category) ? agentResult.AgentType.ToString() : finding.Category,
            EngineType = agentResult.AgentType.ToString(),
            Severity = finding.Severity,
            Title = finding.Message.Length > 500 ? finding.Message[..500] : finding.Message,
            Rationale = finding.Message,
            RelatedNodeIds = [],
            ConfidenceScore = finding.ConfidenceScore,
            EvaluationConfidenceScore = finding.EvaluationConfidenceScore,
            ConfidenceLevel = finding.ConfidenceLevel,
            EnforcementTier = finding.EnforcementTier,
            AgentExecutionTraceId = agentExecutionTraceId,
            ModelDeploymentName = trace?.ModelDeploymentName,
            ModelAlias = trace?.ModelAlias,
            ModelVersion = trace?.ModelVersion,
            PromptTemplateId = trace?.PromptTemplateId,
            PromptTemplateVersion = trace?.PromptTemplateVersion,
            Trace = new ExplainabilityTrace
            {
                SourceAgentExecutionTraceId = traceKey,
                RulesApplied = [agentRuleId],
                DecisionsTaken = [decisionSummary],
                Notes = notes,
                Citations = citations,
                AlternativePathsConsidered = [ExplainabilityMarkers.RuleBasedDeterministicSinglePathNote],
                ReasoningTrace = reasoningTrace,
                ReasoningTraceDigestSha256 = reasoningDigest,
            },
        };
    }
}
