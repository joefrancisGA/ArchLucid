using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Findings;
using ArchLucid.Decisioning.Findings;
using ArchLucid.Decisioning.Findings.Factories;
using ArchLucid.Decisioning.Models;

using FluentAssertions;

namespace ArchLucid.Decisioning.Tests.Findings;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class AgentExplainabilityTraceValidatorTests
{
    [Fact]
    public void ValidateMappedAgentFinding_passes_for_factory_mapped_finding_with_evidence()
    {
        ArchitectureFinding source = new()
        {
            FindingId = "finding-1",
            SourceAgent = AgentType.Compliance,
            Message = "Encrypt PHI at rest.",
            EvidenceRefs = ["manifest:services/db#encryption"],
        };

        AgentResult agent = new()
        {
            AgentType = AgentType.Compliance,
            ReasoningTrace = "Reviewed encryption controls on the database tier.",
        };

        Finding mapped = FindingFactory.CreateFromAgentArchitectureFinding(source, agent);

        AgentExplainabilityTraceValidationResult result =
            AgentExplainabilityTraceValidator.ValidateMappedAgentFinding(mapped, source);

        result.IsValid.Should().BeTrue();
        result.Errors.Should().BeEmpty();
    }

    [Fact]
    public void ValidateMappedAgentFinding_fails_when_trace_is_null()
    {
        ArchitectureFinding source = new()
        {
            FindingId = "finding-null-trace",
            EvidenceRefs = ["e1"],
        };

        Finding mapped = new()
        {
            FindingId = source.FindingId,
            EngineType = AgentType.Topology.ToString(),
            Trace = null!,
        };

        AgentExplainabilityTraceValidationResult result =
            AgentExplainabilityTraceValidator.ValidateMappedAgentFinding(mapped, source);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().ContainSingle(error => error.Contains("ExplainabilityTrace is required", StringComparison.Ordinal));
    }

    [Fact]
    public void ValidateMappedAgentFinding_fails_when_evidence_refs_missing()
    {
        ArchitectureFinding source = new()
        {
            FindingId = "finding-no-evidence",
            Message = "Unanchored claim.",
        };

        AgentResult agent = new() { AgentType = AgentType.Critic };

        Finding mapped = FindingFactory.CreateFromAgentArchitectureFinding(source, agent);

        AgentExplainabilityTraceValidationResult result =
            AgentExplainabilityTraceValidator.ValidateMappedAgentFinding(mapped, source);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(error =>
            error.Contains("must cite at least one evidence ref", StringComparison.Ordinal));
    }

    [Fact]
    public void ValidateMappedAgentFinding_fails_when_evidence_ref_not_anchored_in_trace()
    {
        ArchitectureFinding source = new()
        {
            FindingId = "finding-missing-anchor",
            EvidenceRefs = ["manifest:subnet-a", "manifest:subnet-b"],
        };

        Finding mapped = new()
        {
            FindingId = source.FindingId,
            EngineType = AgentType.Topology.ToString(),
            Trace = new ExplainabilityTrace
            {
                Notes = ["evidence:manifest:subnet-a"],
                RulesApplied = ["agent-Topology"],
                DecisionsTaken = ["Recorded architecture finding from Topology agent."],
                Citations = ["manifest:subnet-a"],
            },
        };

        AgentExplainabilityTraceValidationResult result =
            AgentExplainabilityTraceValidator.ValidateMappedAgentFinding(mapped, source);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(error => error.Contains("manifest:subnet-b", StringComparison.Ordinal));
    }

    [Fact]
    public void ValidateMappedAgentFinding_fails_when_trace_lacks_rules_or_decisions()
    {
        ArchitectureFinding source = new()
        {
            FindingId = "finding-thin-trace",
            EvidenceRefs = ["doc:1"],
        };

        Finding mapped = new()
        {
            FindingId = source.FindingId,
            EngineType = AgentType.Cost.ToString(),
            Trace = new ExplainabilityTrace
            {
                Notes = ["evidence:doc:1"],
                Citations = ["doc:1"],
            },
        };

        AgentExplainabilityTraceValidationResult result =
            AgentExplainabilityTraceValidator.ValidateMappedAgentFinding(mapped, source);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(error => error.Contains("RulesApplied", StringComparison.Ordinal));
        result.Errors.Should().Contain(error => error.Contains("DecisionsTaken", StringComparison.Ordinal));
    }

    [Fact]
    public void Factory_mapped_agent_findings_with_evidence_always_pass_ci_validator()
    {
        foreach (AgentType agentType in Enum.GetValues<AgentType>())
        {
            ArchitectureFinding source = new()
            {
                FindingId = $"finding-{agentType}",
                SourceAgent = agentType,
                Message = $"Finding from {agentType}.",
                EvidenceRefs = [$"evidence:{agentType}"],
            };

            AgentResult agent = new()
            {
                AgentType = agentType,
                ReasoningTrace = $"Reasoning for {agentType}.",
            };

            Finding mapped = FindingFactory.CreateFromAgentArchitectureFinding(source, agent);

            AgentExplainabilityTraceValidationResult result =
                AgentExplainabilityTraceValidator.ValidateMappedAgentFinding(mapped, source);

            result.IsValid.Should().BeTrue(
                because: $"agent type {agentType} must produce sponsor-safe ExplainabilityTrace via FindingFactory");
        }
    }
}
