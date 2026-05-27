using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Findings.Payloads;
using ArchLucid.Core.Manifest;
using ArchLucid.Decisioning.DecisionTraces;
using ArchLucid.Decisioning.Findings;
using ArchLucid.Decisioning.Manifest.Builders;
using ArchLucid.Decisioning.Models;
using ArchLucid.Decisioning.Rules;
using ArchLucid.KnowledgeGraph.Models;

using FluentAssertions;

namespace ArchLucid.Decisioning.Tests;

[Trait("Category", "Unit")]
public sealed class DefaultGoldenManifestBuilderBatchATests
{
    [Fact]
    public async Task Build_security_decision_projects_evaluation_confidence()
    {
        ManifestDocument manifest = await BuildWithFindingsAsync(
        [
            new Finding
            {
                FindingType = FindingTypes.SecurityControlFinding,
                Category = "Security",
                EngineType = "test",
                Severity = FindingSeverity.Error,
                Title = "Missing MFA",
                Rationale = "gap",
                EvaluationConfidenceScore = 88,
                Payload = new SecurityControlFindingPayload
                {
                    ControlId = "mfa",
                    ControlName = "MFA",
                    Status = "missing",
                    Impact = "High risk",
                },
            },
        ]);

        manifest.Decisions.Should().ContainSingle();
        ResolvedArchitectureDecision decision = manifest.Decisions[0];
        decision.Confidence.Should().Be(88);
        decision.ConfidenceSource.Should().Be(DecisionConfidenceSource.FindingEvaluation);
    }

    [Fact]
    public async Task Build_engine_failures_add_manifest_warnings()
    {
        FindingsSnapshot snapshot = new()
        {
            FindingsSnapshotId = Guid.NewGuid(),
            RunId = Guid.NewGuid(),
            ContextSnapshotId = Guid.NewGuid(),
            GraphSnapshotId = Guid.NewGuid(),
            EngineFailures =
            [
                new FindingEngineFailure
                {
                    EngineType = "rule",
                    Category = "topology",
                    ErrorMessage = "boom",
                    ExceptionType = "InvalidOperationException",
                    DurationMs = 12,
                    OccurredUtc = DateTime.UtcNow,
                },
            ],
        };

        ManifestDocument manifest = await BuildWithSnapshotAsync(snapshot);

        manifest.Warnings.Should().Contain(w => w.Contains("Finding engines: 1 failed", StringComparison.Ordinal));
        manifest.Warnings.Should().Contain(w => w.Contains("rule/topology", StringComparison.Ordinal));
    }

    [Fact]
    public async Task Build_null_payload_emits_skipped_warning()
    {
        ManifestDocument manifest = await BuildWithFindingsAsync(
        [
            new Finding
            {
                FindingType = FindingTypes.SecurityControlFinding,
                Category = "Security",
                EngineType = "test",
                Severity = FindingSeverity.Error,
                Title = "Broken payload",
                Rationale = "x",
                Payload = null,
            },
        ]);

        manifest.Warnings.Should().Contain(w =>
            w.Contains("skipped finding", StringComparison.Ordinal)
            && w.Contains("Security", StringComparison.Ordinal));
        manifest.Decisions.Should().BeEmpty();
    }

    [Fact]
    public async Task Build_enrichment_skipped_flag_adds_warning()
    {
        FindingsSnapshot snapshot = new()
        {
            FindingsSnapshotId = Guid.NewGuid(),
            RunId = Guid.NewGuid(),
            ContextSnapshotId = Guid.NewGuid(),
            GraphSnapshotId = Guid.NewGuid(),
            EvaluationConfidenceEnrichmentSkipped = true,
        };

        ManifestDocument manifest = await BuildWithSnapshotAsync(snapshot);

        manifest.Warnings.Should().Contain(w => w.Contains("enrichment was skipped", StringComparison.Ordinal));
    }

    private static async Task<ManifestDocument> BuildWithFindingsAsync(IReadOnlyList<Finding> findings)
    {
        FindingsSnapshot snapshot = new()
        {
            FindingsSnapshotId = Guid.NewGuid(),
            RunId = Guid.NewGuid(),
            ContextSnapshotId = Guid.NewGuid(),
            GraphSnapshotId = Guid.NewGuid(),
            Findings = findings.ToList(),
        };

        return await BuildWithSnapshotAsync(snapshot);
    }

    private static async Task<ManifestDocument> BuildWithSnapshotAsync(FindingsSnapshot snapshot)
    {
        Guid runId = snapshot.RunId;
        Guid ctxId = snapshot.ContextSnapshotId;

        GraphSnapshot graph = new()
        {
            GraphSnapshotId = snapshot.GraphSnapshotId,
            ContextSnapshotId = ctxId,
            RunId = runId,
            Nodes = [],
            Edges = [],
        };

        DecisionTrace trace = RuleAuditTrace.From(new RuleAuditTracePayload
        {
            DecisionTraceId = Guid.NewGuid(),
            RunId = runId,
        });
        DecisionRuleSet ruleSet = await new InMemoryDecisionRuleProvider().GetRuleSetAsync(CancellationToken.None);

        return new DefaultGoldenManifestBuilder().Build(runId, ctxId, graph, snapshot, trace, ruleSet);
    }
}
