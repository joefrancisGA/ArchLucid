using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Persistence.DecisionTraces;
using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.Manifest;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Decisioning.DecisionTraces;
using ArchLucid.Decisioning.Feasibility;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Decisioning.Models;
using ArchLucid.Decisioning.Rules;

using DomainRuleAuditTracePayload = ArchLucid.Decisioning.DecisionTraces.RuleAuditTracePayload;
using DomainRuleAuditTraceWarning = ArchLucid.Decisioning.DecisionTraces.RuleAuditTraceWarning;
using DomainRuleAuditTraceWarningSeverity = ArchLucid.Decisioning.DecisionTraces.RuleAuditTraceWarningSeverity;

namespace ArchLucid.Decisioning.Services;

/// <summary>
///     <see cref="IDecisionEngine" /> implementation that applies an ordered, priority-sorted
///     rule set to each finding in a <see cref="FindingsSnapshot" />, then delegates manifest
///     construction to <see cref="IGoldenManifestBuilder" />.
/// </summary>
/// <remarks>
///     Rules are applied in descending <c>Priority</c> order. For each finding the first matching
///     rule per action type wins; unmatched findings are recorded in
///     <see cref="DomainRuleAuditTracePayload.Notes" />. After manifest construction,
///     <see cref="IGoldenManifestValidator.Validate" /> is called and a content hash is computed
///     via <see cref="IManifestHashService" />.
///     Cancellation is forwarded to <see cref="IDecisionRuleProvider.GetRuleSetAsync" />; the
///     synchronous rule evaluation and manifest build steps do not observe the token.
/// </remarks>
public class RuleBasedDecisionEngine(
    IDecisionRuleProvider ruleProvider,
    IGoldenManifestBuilder manifestBuilder,
    IGoldenManifestValidator manifestValidator,
    IManifestHashService manifestHashService,
    IAuthorityFeasibilityVerdictComposer feasibilityVerdictComposer,
    IDecisionIntakeTrailProvider intakeTrailProvider)
    : IDecisionEngine
{
    private readonly IAuthorityFeasibilityVerdictComposer _feasibilityVerdictComposer =
        feasibilityVerdictComposer ?? throw new ArgumentNullException(nameof(feasibilityVerdictComposer));

    private readonly IDecisionIntakeTrailProvider _intakeTrailProvider =
        intakeTrailProvider ?? throw new ArgumentNullException(nameof(intakeTrailProvider));

    /// <inheritdoc />
    public async Task<(ManifestDocument Manifest, DecisionTraceDto Trace)> DecideAsync(
        Guid runId,
        Guid contextSnapshotId,
        GraphSnapshot graphSnapshot,
        FindingsSnapshot findingsSnapshot,
        CancellationToken ct)
    {
        DecisionRuleSet ruleSet = await ruleProvider.GetRuleSetAsync(ct);
        List<DecisionRule> rules = ruleSet.Rules
            .OrderByDescending(r => r.Priority)
            .ToList();
        DecisionRuleFindingTypeIndex rulesByFindingType = new(rules);

        DomainRuleAuditTracePayload audit = new()
        {
            DecisionTraceId = Guid.NewGuid(),
            RunId = runId,
            CreatedUtc = TimeProvider.System.UtcNowDateTime(),
            RuleSetId = ruleSet.RuleSetId,
            RuleSetVersion = ruleSet.Version,
            RuleSetHash = ruleSet.RuleSetHash
        };

        foreach (Finding finding in findingsSnapshot.Findings)
        {
            IReadOnlyList<DecisionRule> matchingRules = rulesByFindingType.GetByFindingType(finding.FindingType);

            if (matchingRules.Count == 0)
            {
                audit.Notes.Add($"No rule matched finding {finding.FindingId} ({finding.FindingType}).");
                continue;
            }

            foreach (DecisionRule rule in matchingRules)
            {
                if (!DecisionRuleCriteriaEvaluator.TryEvaluate(finding, rule.Criteria, out IReadOnlyList<string> missingContextFieldPaths))
                {
                    if (missingContextFieldPaths.Count > 0)
                    {
                        audit.Warnings.Add(new DomainRuleAuditTraceWarning
                        {
                            RuleId = rule.RuleId,
                            MissingFieldPaths = missingContextFieldPaths.ToList(),
                            Severity = DomainRuleAuditTraceWarningSeverity.Warning
                        });
                    }

                    continue;
                }

                audit.AppliedRuleIds.Add(rule.RuleId);

                switch (rule.Action.ToLowerInvariant())
                {
                    case "require":
                        audit.RequiredFindingIds.Add(finding.FindingId);
                        audit.AcceptedFindingIds.Add(finding.FindingId);
                        break;

                    case "allow":
                        audit.AllowedFindingIds.Add(finding.FindingId);
                        audit.AcceptedFindingIds.Add(finding.FindingId);
                        break;

                    case "prefer":
                        audit.PreferredFindingIds.Add(finding.FindingId);
                        audit.AcceptedFindingIds.Add(finding.FindingId);
                        break;

                    case "reject":
                        audit.RejectedFindingIds.Add(finding.FindingId);
                        audit.Notes.Add($"Rejected finding {finding.FindingId} by rule {rule.Name}.");
                        break;

                    default:
                        audit.Notes.Add($"No recognized action for rule {rule.Name}.");
                        break;
                }
            }
        }

        audit.ContextSnapshotId = contextSnapshotId;
        audit.GraphSnapshotId = graphSnapshot.GraphSnapshotId;
        audit.FindingsSnapshotId = findingsSnapshot.FindingsSnapshotId;
        audit.PromptRefs = RuleAuditTracePromptRefAggregator.FromAcceptedFindings(
            findingsSnapshot,
            audit.AcceptedFindingIds);

        DecisionTrace trace = RuleAuditTrace.From(audit);

        ManifestDocument manifest = manifestBuilder.Build(
            runId,
            contextSnapshotId,
            graphSnapshot,
            findingsSnapshot,
            trace,
            ruleSet);

        TransparencyTrail? intakeTrail =
            await _intakeTrailProvider.TryGetTransparencyTrailAsync(runId, ct);
        manifest.FeasibilityVerdict = _feasibilityVerdictComposer.Compose(
            manifest,
            intakeTrail,
            findingsSnapshot,
            audit.AcceptedFindingIds);

        manifestValidator.Validate(manifest);
        manifest.ManifestHash = manifestHashService.ComputeHash(manifest);

        return (manifest, DecisionTraceRecordMapper.ToDto(trace));
    }
}
