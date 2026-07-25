using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Findings;

using FluentAssertions;

using Moq;

namespace ArchLucid.AgentRuntime.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class AgentRuntimePackageCoverageBatch14Tests
{
    [Fact]
    public void AgentHandlerLlmResolution_returns_primary_and_schema_remediation_clients()
    {
        Mock<IAgentCompletionClient> primary = new();
        Mock<ISchemaRemediationAgentCompletionClient> remediation = new();
        Mock<IAgentTierCompletionRouter> router = new();
        AgentTask task = new()
        {
            TaskId = "task-1",
            RunId = "run-1",
            AgentType = AgentType.Topology,
            ModelTierOverride = LlmModelTier.Premium,
        };

        router
            .Setup(r => r.ResolveForAgent(AgentType.Topology, LlmModelTier.Premium))
            .Returns((primary.Object, LlmModelTier.Premium));

        (IAgentCompletionClient resolvedPrimary, IAgentCompletionClient resolvedRemediation) =
            AgentHandlerLlmResolution.ResolveCompletionClients(
                router.Object,
                remediation.Object,
                AgentType.Topology,
                task);

        resolvedPrimary.Should().BeSameAs(primary.Object);
        resolvedRemediation.Should().BeSameAs(remediation.Object);
    }

    [Fact]
    public void AgentHandlerLlmResolution_rejects_null_dependencies()
    {
        AgentTask task = new() { TaskId = "task-1", RunId = "run-1", AgentType = AgentType.Cost };

        Action nullRouter = () => AgentHandlerLlmResolution.ResolveCompletionClients(
            null!,
            Mock.Of<ISchemaRemediationAgentCompletionClient>(),
            AgentType.Cost,
            task);

        nullRouter.Should().Throw<ArgumentNullException>();
    }

    [Theory]
    [InlineData("doc:requirements.md#line-42", true)]
    [InlineData("request", false)]
    public void CriticFindingEvidenceCitationRules_detects_concrete_citations(string evidenceRef, bool expected)
    {
        ArchitectureFinding finding = new()
        {
            Message = "Storage account allows public access.",
            EvidenceRefs = [evidenceRef],
        };

        CriticFindingEvidenceCitationRules.HasConcreteEvidenceCitation(finding).Should().Be(expected);
        CriticFindingEvidenceCitationRules.HasConcreteEvidenceCitation([evidenceRef]).Should().Be(expected);
    }

    [Fact]
    public void AgentResultFindingEnforcementTierApplier_classifies_all_findings()
    {
        AgentResult result = new()
        {
            AgentType = AgentType.Critic,
            Findings =
            [
                new ArchitectureFinding
                {
                    Message = "Enable MFA for all user accounts.",
                    EvidenceRefs = ["critic-checklist"],
                },
                new ArchitectureFinding
                {
                    Message = "Blob container allows anonymous access to /subscriptions/abc/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/sa1.",
                    EvidenceRefs = ["doc:blob-policy.json"],
                },
            ],
        };

        AgentResultFindingEnforcementTierApplier.Apply(result);

        result.Findings[0].EnforcementTier.Should().Be(FindingEnforcementTier.Advisory);
        result.Findings[1].EnforcementTier.Should().Be(FindingEnforcementTier.PolicyViolation);
    }

    [Fact]
    public void InsightDensityLlmJudgmentFaithfulnessValidator_accepts_finding_evidence_when_judge_refs_empty()
    {
        ArchitectureFinding finding = new()
        {
            Message = "Public endpoint detected.",
            EvidenceRefs = ["doc:architecture.pdf#page-3"],
        };
        InsightDensityLlmJudgment judgment = new()
        {
            FindingId = finding.FindingId,
            InsightDensityScore = 72,
            EvidenceRefs = [],
        };
        AgentEvidencePackage evidence = new()
        {
            SystemName = "Payments",
            Request = new RequestEvidence { Description = "Batch payments platform" },
        };

        InsightDensityLlmJudgmentFaithfulnessValidator.IsFaithful(judgment, finding, evidence).Should().BeTrue();
    }

    [Fact]
    public void InsightDensityLlmJudgmentFaithfulnessValidator_rejects_out_of_package_evidence_refs()
    {
        ArchitectureFinding finding = new()
        {
            Message = "Missing private endpoint on SQL.",
            EvidenceRefs = ["doc:sql-requirements.md"],
        };
        InsightDensityLlmJudgment judgment = new()
        {
            FindingId = finding.FindingId,
            InsightDensityScore = 55,
            EvidenceRefs = ["policy:unknown-pack"],
        };
        AgentEvidencePackage evidence = new()
        {
            SystemName = "Ledger",
            Request = new RequestEvidence { Description = "Ledger service" },
            Policies =
            [
                new PolicyEvidence
                {
                    PolicyId = "policy-allowed",
                    Title = "Encryption required",
                    Summary = "All data stores must encrypt at rest.",
                },
            ],
        };

        InsightDensityLlmJudgmentFaithfulnessValidator.IsFaithful(judgment, finding, evidence).Should().BeFalse();
    }

    [Fact]
    public void InsightDensityLlmJudgmentFaithfulnessValidator_accepts_policy_refs_from_evidence_package()
    {
        ArchitectureFinding finding = new()
        {
            Message = "Storage lacks required encryption control.",
            EvidenceRefs = [],
        };
        InsightDensityLlmJudgment judgment = new()
        {
            FindingId = finding.FindingId,
            InsightDensityScore = 80,
            EvidenceRefs = ["policy-allowed"],
        };
        AgentEvidencePackage evidence = new()
        {
            SystemName = "Ledger",
            Request = new RequestEvidence { Description = "Ledger service" },
            Policies =
            [
                new PolicyEvidence
                {
                    PolicyId = "policy-allowed",
                    Title = "Encryption required",
                    Summary = "All data stores must encrypt at rest.",
                },
            ],
        };

        InsightDensityLlmJudgmentFaithfulnessValidator.IsFaithful(judgment, finding, evidence).Should().BeTrue();
    }

    [Fact]
    public void RealLiveAoaiEvidenceProfiles_exposes_gate_script_labels()
    {
        RealLiveAoaiEvidenceProfiles.TopologyOnly.Should().Be("topology-only");
        RealLiveAoaiEvidenceProfiles.FullPipeline.Should().Be("full-pipeline");
    }
}
