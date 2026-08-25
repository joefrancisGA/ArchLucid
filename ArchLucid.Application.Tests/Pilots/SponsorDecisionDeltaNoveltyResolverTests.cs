using ArchLucid.Application.Pilots;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Explanation;
using ArchLucid.Contracts.Manifest;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Contracts.Pilots;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Pilots;

[Trait("Suite", "Core")]
public sealed class SponsorDecisionDeltaNoveltyResolverTests
{
    [Fact]
    public void Resolve_when_snapshot_fallback_findings_present_uses_deltas_for_decision_delta()
    {
        ArchitectureRunDetail detail = BuildDetail(isCommitted: true, includeFindings: false);
        PilotRunDeltas deltas = BuildDeltas() with
        {
            SnapshotFallbackFindings =
            [
                new ArchitectureFinding
                {
                    FindingId = "f-governed",
                    Severity = FindingSeverity.Critical,
                    Category = "security",
                    Message = "Enable TLS 1.2 minimum",
                    EvidenceRefs = ["trace:trace-1"],
                    EvaluationConfidenceScore = 88,
                    ConfidenceLevel = FindingConfidenceLevel.High,
                },
            ],
            TopFindingId = "f-governed",
            TopFindingSeverity = "Critical",
        };
        ProofPackageCompletenessResponse proof = BuildProof();
        PilotBuyerSafeEvidenceGateResult gate = BuildGate();

        SponsorDecisionDeltaNoveltyResult result = SponsorDecisionDeltaNoveltyResolver.Resolve(
            detail,
            deltas,
            proof,
            gate);

        result.DecisionDeltaSummary.Should().Contain("Critical");
        result.DecisionDeltaSummary.Should().NotContain("No active findings recorded");
        result.NoveltyConfidence.Should().NotBe(SponsorNoveltyConfidence.NotAssessed);
    }

    [Fact]
    public void Resolve_when_committed_with_findings_emits_partial_or_strong_novelty()
    {
        ArchitectureRunDetail detail = BuildDetail(isCommitted: true, includeFindings: true);
        PilotRunDeltas deltas = BuildDeltas();
        ProofPackageCompletenessResponse proof = BuildProof();
        PilotBuyerSafeEvidenceGateResult gate = BuildGate();

        SponsorDecisionDeltaNoveltyResult result = SponsorDecisionDeltaNoveltyResolver.Resolve(
            detail,
            deltas,
            proof,
            gate);

        result.DecisionDeltaSummary.Should().Contain("Error");
        result.NonObviousRationale.Should().NotBeNullOrWhiteSpace();
        result.NoveltyConfidence.Should().BeOneOf(
            SponsorNoveltyConfidence.Partial,
            SponsorNoveltyConfidence.Strong);
        result.EvidenceClassLabel.Should().Contain("PilotStrict");
        result.ConfidenceBasisSummary.Should().Contain("blind principal-architect sessions");
    }

    [Fact]
    public void Resolve_when_uncommitted_marks_decision_delta_not_attested()
    {
        ArchitectureRunDetail detail = BuildDetail(isCommitted: false, includeFindings: false);
        PilotRunDeltas deltas = BuildDeltas();
        ProofPackageCompletenessResponse proof = BuildProof();
        PilotBuyerSafeEvidenceGateResult gate = BuildGate();

        SponsorDecisionDeltaNoveltyResult result = SponsorDecisionDeltaNoveltyResolver.Resolve(
            detail,
            deltas,
            proof,
            gate);

        result.DecisionDeltaSummary.Should().Contain("not committed");
        result.NoveltyConfidence.Should().Be(SponsorNoveltyConfidence.NotAssessed);
    }

    [Fact]
    public void Markdown_formatter_emits_required_section_headings()
    {
        SponsorDecisionDeltaNoveltyResult result = new(
            "1. **Error** (Security) — rotate keys",
            "Evidence references present.",
            SponsorNoveltyConfidence.Partial,
            "Persisted run proof with PilotStrict posture attested",
            "active findings: 1; PilotStrict posture: satisfied");

        System.Text.StringBuilder sb = new();
        SponsorDecisionDeltaNoveltyMarkdownFormatter.AppendMarkdownSections(sb, result);
        string markdown = sb.ToString();

        markdown.Should().Contain(SponsorDecisionDeltaNoveltyResolver.DecisionDeltaSectionHeading);
        markdown.Should().Contain(SponsorDecisionDeltaNoveltyResolver.NoveltyConfidenceSectionHeading);
        markdown.Should().Contain("**Confidence:** **Partial**");
        markdown.Should().Contain("**Evidence class:**");
    }

    private static ArchitectureRunDetail BuildDetail(bool isCommitted, bool includeFindings)
    {
        GoldenManifest? manifest = isCommitted
            ? new GoldenManifest
            {
                RunId = "r1",
                SystemName = "SysA",
                Metadata = new ManifestMetadata
                {
                    ManifestVersion = "v1",
                    CreatedUtc = new DateTime(2026, 4, 1, 0, 10, 0, DateTimeKind.Utc),
                },
                Governance = new ManifestGovernance(),
            }
            : null;

        List<AgentResult> results = [];

        if (includeFindings)
        {
            results.Add(
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
                            Category = "Security",
                            Message = "Rotate storage account keys",
                            EvidenceRefs = ["doc:security-baseline"],
                            EvaluationConfidenceScore = 82,
                            ConfidenceLevel = FindingConfidenceLevel.High,
                        },
                    ],
                });
        }

        return new ArchitectureRunDetail
        {
            Run = new ArchitectureRun
            {
                RunId = "r1",
                Status = isCommitted ? ArchitectureRunStatus.Committed : ArchitectureRunStatus.ReadyForCommit,
                CreatedUtc = new DateTime(2026, 4, 1, 0, 0, 0, DateTimeKind.Utc),
                CurrentManifestVersion = isCommitted ? "v1" : null,
            },
            Manifest = manifest,
            Results = results,
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
        };

    private static ProofPackageCompletenessResponse BuildProof() =>
        new()
        {
            AgentOutputPilotStrictEvidenceSatisfied = true,
            LlmCallCountResolved = true,
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
