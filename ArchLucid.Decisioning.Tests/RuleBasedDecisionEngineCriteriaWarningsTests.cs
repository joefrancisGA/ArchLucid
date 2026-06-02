using ArchLucid.Contracts.Persistence.DecisionTraces;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Decisioning.Manifest.Builders;
using ArchLucid.Decisioning.Models;
using ArchLucid.Decisioning.Services;
using ArchLucid.KnowledgeGraph.Models;

using FluentAssertions;

namespace ArchLucid.Decisioning.Tests;

/// <summary>
///     Tests for <see cref="RuleBasedDecisionEngine" /> criteria warnings on partial rule matches.
/// </summary>
[Trait("Suite", "Core")]
public sealed class RuleBasedDecisionEngineCriteriaWarningsTests
{
    [Fact]
    public async Task DecideAsync_when_criteria_context_field_missing_emits_warning_and_skips_rule_action()
    {
        Guid runId = Guid.NewGuid();
        Guid contextSnapshotId = Guid.NewGuid();
        GraphSnapshot graph = new() { GraphSnapshotId = Guid.NewGuid(), RunId = runId };

        Finding finding = new()
        {
            FindingId = "finding-missing-control",
            FindingType = "SecurityControlFinding",
            Category = "Security",
            EngineType = "SecurityBaselineFindingEngine",
            Severity = FindingSeverity.Warning,
            Title = "MFA control gap",
            Rationale = "Control status is missing.",
            Payload = new SecurityControlFindingPayload
            {
                ControlName = "MFA",
                Status = "missing",
                Impact = "High"
            },
            PayloadType = nameof(SecurityControlFindingPayload)
        };

        FindingsSnapshot snapshot = new() { Findings = [finding] };

        StubDecisionRuleProvider ruleProvider = new(
            new DecisionRule
            {
                RuleId = "rule-require-control-id",
                Name = "Require control id on security findings",
                Priority = 100,
                AppliesToFindingType = "SecurityControlFinding",
                Action = "require",
                Criteria = new Dictionary<string, string> { ["payload.controlId"] = "AC-2" }
            });

        RuleBasedDecisionEngine engine = new(
            ruleProvider,
            new DefaultGoldenManifestBuilder(),
            new GoldenManifestValidator(),
            new ManifestHashService());

        (_, DecisionTraceDto trace) = await engine.DecideAsync(runId, contextSnapshotId, graph, snapshot, CancellationToken.None);

        RuleAuditTracePayload audit = trace.RequireRuleAudit();
        audit.Warnings.Should().ContainSingle();
        RuleAuditTraceWarning warning = audit.Warnings[0];
        warning.RuleId.Should().Be("rule-require-control-id");
        warning.MissingFieldPaths.Should().ContainSingle().Which.Should().Be("payload.controlId");
        warning.Severity.Should().Be(RuleAuditTraceWarningSeverity.Warning);
        audit.AppliedRuleIds.Should().BeEmpty();
        audit.AcceptedFindingIds.Should().BeEmpty();
    }

    [Fact]
    public async Task DecideAsync_when_criteria_satisfied_applies_rule_without_warning()
    {
        Guid runId = Guid.NewGuid();
        Guid contextSnapshotId = Guid.NewGuid();
        GraphSnapshot graph = new() { GraphSnapshotId = Guid.NewGuid(), RunId = runId };

        Finding finding = new()
        {
            FindingId = "finding-with-control",
            FindingType = "SecurityControlFinding",
            Category = "Security",
            EngineType = "SecurityBaselineFindingEngine",
            Severity = FindingSeverity.Warning,
            Title = "MFA control gap",
            Rationale = "Control status is missing.",
            Payload = new SecurityControlFindingPayload
            {
                ControlId = "AC-2",
                ControlName = "MFA",
                Status = "missing",
                Impact = "High"
            },
            PayloadType = nameof(SecurityControlFindingPayload)
        };

        FindingsSnapshot snapshot = new() { Findings = [finding] };

        StubDecisionRuleProvider ruleProvider = new(
            new DecisionRule
            {
                RuleId = "rule-require-control-id",
                Name = "Require control id on security findings",
                Priority = 100,
                AppliesToFindingType = "SecurityControlFinding",
                Action = "require",
                Criteria = new Dictionary<string, string> { ["payload.controlId"] = "AC-2" }
            });

        RuleBasedDecisionEngine engine = new(
            ruleProvider,
            new DefaultGoldenManifestBuilder(),
            new GoldenManifestValidator(),
            new ManifestHashService());

        (_, DecisionTraceDto trace) = await engine.DecideAsync(runId, contextSnapshotId, graph, snapshot, CancellationToken.None);

        RuleAuditTracePayload audit = trace.RequireRuleAudit();
        audit.Warnings.Should().BeEmpty();
        audit.AppliedRuleIds.Should().ContainSingle().Which.Should().Be("rule-require-control-id");
        audit.AcceptedFindingIds.Should().ContainSingle().Which.Should().Be("finding-with-control");
        audit.RequiredFindingIds.Should().ContainSingle().Which.Should().Be("finding-with-control");
        audit.AllowedFindingIds.Should().BeEmpty();
        audit.PreferredFindingIds.Should().BeEmpty();
    }

    private sealed class StubDecisionRuleProvider(params DecisionRule[] rules) : IDecisionRuleProvider
    {
        public Task<DecisionRuleSet> GetRuleSetAsync(CancellationToken ct)
        {
            ct.ThrowIfCancellationRequested();
            DecisionRuleSet ruleSet = new()
            {
                RuleSetId = "test-rules",
                Version = "1",
                Rules = rules.ToList()
            };

            ruleSet.ComputeHash();
            return Task.FromResult(ruleSet);
        }
    }
}
