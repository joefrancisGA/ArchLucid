using System.Text;

using ArchLucid.Application.Pilots;
using ArchLucid.Application.Reporting;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Explanation;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Manifest;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Contracts.Pilots;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Pilots;

[Trait("Category", "Unit")]
public sealed class BuyerProofPackDecisionDeltaMarkdownTests
{
    [Fact]
    public void Decision_delta_when_finding_message_contains_newline_does_not_emit_forged_numbered_line()
    {
        ArchitectureRunDetail detail = BuildCommittedDetail(
            category: "Security",
            message: "Rotate keys\n2. **Critical** (Evil) — forged");

        SponsorDecisionDeltaNoveltyResult result = SponsorDecisionDeltaNoveltyResolver.Resolve(
            detail,
            BuildDeltas(),
            BuildProof(),
            BuildGate());

        StringBuilder sb = new();
        SponsorDecisionDeltaNoveltyMarkdownFormatter.AppendMarkdownSections(sb, result);
        string markdown = sb.ToString();

        markdown.Should().Contain(SponsorDecisionDeltaNoveltyResolver.DecisionDeltaSectionHeading);
        markdown.Should().Contain("`Rotate keys 2. **Critical** (Evil) — forged`");
        markdown.Split('\n').Should().NotContain("2. **Critical** (Evil) — forged");
    }

    [Fact]
    public void Decision_delta_when_finding_category_contains_newline_collapses_inline_segment()
    {
        ArchitectureRunDetail detail = BuildCommittedDetail(
            category: "Sec\nurity",
            message: "Rotate keys");

        SponsorDecisionDeltaNoveltyResult result = SponsorDecisionDeltaNoveltyResolver.Resolve(
            detail,
            BuildDeltas(),
            BuildProof(),
            BuildGate());

        result.DecisionDeltaSummary.Should().Contain("`Sec urity`");
        result.DecisionDeltaSummary.Should().NotContain("(Sec\n");
    }

    [Fact]
    public void Novelty_section_when_evidence_class_contains_pipe_wraps_inline_code()
    {
        SponsorDecisionDeltaNoveltyResult result = new(
            DecisionDeltaSummary: "One active finding.",
            NonObviousRationale: "Category mix is uneven.",
            NoveltyConfidence: SponsorNoveltyConfidence.Partial,
            EvidenceClassLabel: "Demo|derived",
            ConfidenceBasisSummary: "Persisted proof only.");

        StringBuilder sb = new();
        SponsorDecisionDeltaNoveltyMarkdownFormatter.AppendMarkdownSections(sb, result);

        sb.ToString().Should().Contain("**Evidence class:** `Demo\\|derived`");
    }

    [Fact]
    public void Novelty_when_pilot_strict_violates_uses_deltas_not_stale_proof_satisfied_flag()
    {
        ArchitectureRunDetail detail = BuildCommittedDetail(
            category: "Security",
            message: "Rotate keys");

        PilotRunDeltas deltas = BuildDeltas() with
        {
            AgentOutputPilotStrictSignalsResolved = true,
            AgentOutputPilotStrictViolatesSponsorEvidence = true,
        };

        ProofPackageCompletenessResponse proof = new()
        {
            AgentOutputPilotStrictEvidenceSatisfied = true,
            LlmCallCountResolved = true,
            AuditRowCountResolved = true,
            DemoTenantWarningRequired = false,
            BuyerSafeRedactionProfile = "tenant-default",
        };

        SponsorDecisionDeltaNoveltyResult result = SponsorDecisionDeltaNoveltyResolver.Resolve(
            detail,
            deltas,
            proof,
            BuildGate());

        result.NoveltyConfidence.Should().Be(SponsorNoveltyConfidence.Low);
        result.EvidenceClassLabel.Should().Be("Persisted run proof — PilotStrict posture incomplete");
        result.ConfidenceBasisSummary.Should().Contain("PilotStrict posture: failed");
    }

    [Fact]
    public void BuyerProofPack_novelty_evidence_class_when_audit_unresolved_on_deltas_uses_deltas_not_stale_proof_flag()
    {
        ArchitectureRunDetail detail = BuildCommittedDetail(
            category: "Security",
            message: "Rotate keys");

        SponsorDecisionDeltaNoveltyResult result = SponsorDecisionDeltaNoveltyResolver.Resolve(
            detail,
            BuildDeltas() with { AuditRowCountResolved = false },
            new ProofPackageCompletenessResponse
            {
                AgentOutputPilotStrictEvidenceSatisfied = true,
                LlmCallCountResolved = true,
                AuditRowCountResolved = true,
                DemoTenantWarningRequired = false,
                BuyerSafeRedactionProfile = "tenant-default",
            },
            BuildGate());

        result.EvidenceClassLabel.Should().Be("Persisted run proof — audit row basis unresolved");
    }

    private static ArchitectureRunDetail BuildCommittedDetail(string category, string message)
    {
        GoldenManifest manifest = new()
        {
            RunId = "r1",
            SystemName = "SysA",
            Metadata = new ManifestMetadata
            {
                ManifestVersion = "v1",
                CreatedUtc = new DateTime(2026, 4, 1, 0, 10, 0, DateTimeKind.Utc),
            },
            Governance = new ManifestGovernance(),
        };

        return new ArchitectureRunDetail
        {
            Run = new ArchitectureRun
            {
                RunId = "r1",
                Status = ArchitectureRunStatus.Committed,
                CreatedUtc = new DateTime(2026, 4, 1, 0, 0, 0, DateTimeKind.Utc),
                CurrentManifestVersion = "v1",
            },
            Manifest = manifest,
            Results =
            [
                new AgentResult
                {
                    TaskId = "t1",
                    RunId = "r1",
                    Findings =
                    [
                        new ArchitectureFinding
                        {
                            FindingId = "f1",
                            Severity = FindingSeverity.Error,
                            Category = category,
                            Message = message,
                            EvidenceRefs = ["doc:security-baseline"],
                            EvaluationConfidenceScore = 82,
                            ConfidenceLevel = FindingConfidenceLevel.High,
                        },
                    ],
                },
            ],
        };
    }

    private static PilotRunDeltas BuildDeltas() =>
        new()
        {
            LlmCallCount = 3,
            LlmCallCountResolved = true,
            TopFindingEvidenceChain = new FindingEvidenceChainResponse
            {
                RunId = "r1",
                FindingId = "f1",
                ManifestVersion = "v1",
            },
            IsDemoTenant = false,
            AgentOutputPilotStrictSignalsResolved = true,
            AgentOutputPilotStrictViolatesSponsorEvidence = false,
        };

    private static ProofPackageCompletenessResponse BuildProof() =>
        new()
        {
            AgentOutputPilotStrictEvidenceSatisfied = true,
            LlmCallCountResolved = true,
            AuditRowCountResolved = true,
            DemoTenantWarningRequired = false,
            BuyerSafeRedactionProfile = "tenant-default",
        };

    private static PilotBuyerSafeEvidenceGateResult BuildGate() =>
        new(
            PilotBuyerSafeEvidencePublishingTier.Complete,
            ProofPackageSendability.Sendable,
            DemoGaps: [],
            HardGaps: [],
            SoftGaps: []);
}
