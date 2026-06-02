using ArchLucid.Contracts.Persistence.DecisionTraces;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Decisioning.Manifest.Builders;
using ArchLucid.Decisioning.Models;
using ArchLucid.Decisioning.Services;
using ArchLucid.KnowledgeGraph.Models;

using FluentAssertions;

namespace ArchLucid.Decisioning.Tests;

/// <summary>
///     TB-204: <see cref="RuleBasedDecisionEngine" /> records require/allow/prefer finding sets separately.
/// </summary>
[Trait("Suite", "Core")]
public sealed class RuleBasedDecisionEngineActionDifferentiationTests
{
    [Fact]
    public async Task DecideAsync_populates_action_specific_finding_id_sets()
    {
        Guid runId = Guid.NewGuid();
        Guid contextSnapshotId = Guid.NewGuid();
        GraphSnapshot graph = new() { GraphSnapshotId = Guid.NewGuid(), RunId = runId };

        FindingsSnapshot snapshot = new()
        {
            Findings =
            [
                CreateFinding("finding-required", "CostFinding"),
                CreateFinding("finding-allowed", "SecurityControlFinding"),
                CreateFinding("finding-preferred", "ReliabilityFinding"),
            ],
        };

        StubDecisionRuleProvider ruleProvider = new(
            new DecisionRule
            {
                RuleId = "rule-require-cost",
                Name = "Require cost finding",
                Priority = 300,
                AppliesToFindingType = "CostFinding",
                Action = "require",
            },
            new DecisionRule
            {
                RuleId = "rule-allow-security",
                Name = "Allow security finding",
                Priority = 200,
                AppliesToFindingType = "SecurityControlFinding",
                Action = "allow",
            },
            new DecisionRule
            {
                RuleId = "rule-prefer-reliability",
                Name = "Prefer reliability finding",
                Priority = 100,
                AppliesToFindingType = "ReliabilityFinding",
                Action = "prefer",
            });

        RuleBasedDecisionEngine engine = new(
            ruleProvider,
            new DefaultGoldenManifestBuilder(),
            new GoldenManifestValidator(),
            new ManifestHashService());

        (_, DecisionTraceDto trace) = await engine.DecideAsync(runId, contextSnapshotId, graph, snapshot, CancellationToken.None);

        RuleAuditTracePayload audit = trace.RequireRuleAudit();
        audit.RequiredFindingIds.Should().ContainSingle().Which.Should().Be("finding-required");
        audit.AllowedFindingIds.Should().ContainSingle().Which.Should().Be("finding-allowed");
        audit.PreferredFindingIds.Should().ContainSingle().Which.Should().Be("finding-preferred");
        audit.AcceptedFindingIds.Should().BeEquivalentTo(
            ["finding-required", "finding-allowed", "finding-preferred"]);
    }

    private static Finding CreateFinding(string findingId, string findingType) =>
        new()
        {
            FindingId = findingId,
            FindingType = findingType,
            Category = "Test",
            EngineType = "TestFindingEngine",
            Severity = FindingSeverity.Info,
            Title = findingId,
            Rationale = "Test finding.",
            PayloadType = "object",
        };

    private sealed class StubDecisionRuleProvider(params DecisionRule[] rules) : IDecisionRuleProvider
    {
        public Task<DecisionRuleSet> GetRuleSetAsync(CancellationToken ct)
        {
            ct.ThrowIfCancellationRequested();
            DecisionRuleSet ruleSet = new()
            {
                RuleSetId = "test-rules",
                Version = "1",
                Rules = rules.ToList(),
            };

            ruleSet.ComputeHash();
            return Task.FromResult(ruleSet);
        }
    }
}
