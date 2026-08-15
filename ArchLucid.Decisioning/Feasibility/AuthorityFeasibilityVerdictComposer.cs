using System.Text.Json;

using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Manifest;
using ArchLucid.Core.Manifest.Sections;
using ArchLucid.Decisioning.Models;

namespace ArchLucid.Decisioning.Feasibility;

/// <inheritdoc cref="IAuthorityFeasibilityVerdictComposer" />
public sealed class AuthorityFeasibilityVerdictComposer(FeasibilityVerdictBuilder verdictBuilder) : IAuthorityFeasibilityVerdictComposer
{
    private static readonly JsonSerializerOptions TrailCloneOptions = new(JsonSerializerDefaults.Web);

    private readonly FeasibilityVerdictBuilder _verdictBuilder =
        verdictBuilder ?? throw new ArgumentNullException(nameof(verdictBuilder));

    /// <inheritdoc />
    public FeasibilityVerdict Compose(
        ManifestDocument manifest,
        TransparencyTrail? intakeTransparencyTrail,
        FindingsSnapshot? findingsSnapshot = null,
        IReadOnlyList<string>? acceptedFindingIds = null)
    {
        ArgumentNullException.ThrowIfNull(manifest);

        TransparencyTrail trail = CloneTrail(intakeTransparencyTrail) ?? new TransparencyTrail();
        EnrichTrailFromManifest(manifest, trail);

        List<string> unsatCoreKeys = CollectUnsatCoreInvariantKeys(manifest);

        if (IsFeasible(manifest, trail)
            && !FeasibilityFindingSeveritySignals.HasBlockingAcceptedSeverities(findingsSnapshot, acceptedFindingIds))
        {
            return _verdictBuilder.Feasible(
                "Authority pipeline resolved a satisfiable architecture within stated constraints.",
                trail);
        }

        if (IsFeasible(manifest, trail)
            && FeasibilityFindingSeveritySignals.HasBlockingAcceptedSeverities(findingsSnapshot, acceptedFindingIds))
        {
            IReadOnlyList<string> blockingFindingIds =
                FeasibilityFindingSeveritySignals.CollectBlockingAcceptedFindingIds(
                    findingsSnapshot,
                    acceptedFindingIds);

            foreach (string findingId in blockingFindingIds)
                UpsertInferred(trail, $"finding.blocking.{findingId}", $"Accepted finding {findingId} is Error or Critical.", 90);

            SoftInfeasibilityEnvelope severityEnvelope = new()
            {
                ConfidenceLow = 55,
                ConfidenceHigh = 90,
                EnvelopeDescription =
                    "Manifest structure resolved, but decision-grade findings include blocking Error or Critical severities.",
                SoftAssumption =
                    "Accepted findings accurately reflect deployment risk for this architecture snapshot.",
                CostOfBeingWrong =
                    "Treating the design as production-ready while blocking severities remain may ship unresolved architecture risk.",
            };

            return _verdictBuilder.SoftInfeasible(
                "Accepted findings include blocking Error or Critical severities.",
                trail,
                severityEnvelope,
                unsatCoreKeys,
                BuildProposedRelaxations(unsatCoreKeys));
        }

        string summary = BuildSoftSummary(manifest, trail);
        SoftInfeasibilityEnvelope envelope = BuildSoftEnvelope(manifest, trail);
        List<ProposedRelaxation> relaxations = BuildProposedRelaxations(unsatCoreKeys);

        return _verdictBuilder.SoftInfeasible(
            summary,
            trail,
            envelope,
            unsatCoreKeys,
            relaxations);
    }

    private static bool IsFeasible(ManifestDocument manifest, TransparencyTrail trail)
    {
        if (!string.Equals(manifest.Metadata.Status, "Resolved", StringComparison.OrdinalIgnoreCase))
            return false;

        if (manifest.Policy.Violations.Count > 0)
            return false;

        if (manifest.UnresolvedIssues.Items.Count > 0)
            return false;

        if (manifest.Requirements.Uncovered.Exists(static item => item.IsMandatory))
            return false;

        if (trail.HasSkippedMustQuestions)
            return false;

        return true;
    }

    private static string BuildSoftSummary(ManifestDocument manifest, TransparencyTrail trail)
    {
        if (trail.HasSkippedMustQuestions)
            return "Architecture run completed with unanswered MUST-tier intake questions.";

        if (manifest.Policy.Violations.Count > 0)
            return "Policy controls are not satisfied for the proposed architecture.";

        if (manifest.UnresolvedIssues.Items.Count > 0)
            return "Authority pipeline left unresolved design issues on the manifest.";

        if (manifest.Requirements.Uncovered.Exists(static item => item.IsMandatory))
            return "Mandatory requirements remain uncovered after rule evaluation.";

        if (!string.Equals(manifest.Metadata.Status, "Resolved", StringComparison.OrdinalIgnoreCase))
            return "Manifest status indicates the design still needs operator attention.";

        return "Authority pipeline surfaced soft infeasibility signals on the committed manifest.";
    }

    private static SoftInfeasibilityEnvelope BuildSoftEnvelope(ManifestDocument manifest, TransparencyTrail trail)
    {
        int confidenceLow = 45;
        int confidenceHigh = 80;

        if (trail.HasSkippedMustQuestions)
        {
            confidenceLow = 35;
            confidenceHigh = 65;
        }

        if (manifest.Policy.Violations.Count > 0)
        {
            confidenceLow = 50;
            confidenceHigh = 85;
        }

        return new SoftInfeasibilityEnvelope
        {
            ConfidenceLow = confidenceLow,
            ConfidenceHigh = confidenceHigh,
            EnvelopeDescription =
                "Verdict holds for the evaluated manifest snapshot; relaxing constraints or answering skipped MUST questions may change the outcome.",
            SoftAssumption =
                "Operator assertions and inferred intake entries accurately represent deployment intent for this run.",
            CostOfBeingWrong =
                "Treating a soft infeasible design as production-ready may ship policy gaps or under-specified controls.",
        };
    }

    private static List<ProposedRelaxation> BuildProposedRelaxations(IReadOnlyList<string> unsatCoreKeys)
    {
        List<ProposedRelaxation> relaxations = [];

        foreach (string invariantKey in unsatCoreKeys)
        {
            relaxations.Add(
                new ProposedRelaxation
                {
                    InvariantKey = invariantKey,
                    TradeOffDescription =
                        $"Relax or re-scope invariant {invariantKey}; ArchLucid proposes the trade-off but does not apply it silently.",
                });
        }

        return relaxations;
    }

    private static List<string> CollectUnsatCoreInvariantKeys(ManifestDocument manifest)
    {
        List<string> segments =
        [
            .. manifest.Policy.Violations.Select(static violation => violation.Description),
            .. manifest.Policy.Violations.Select(static violation => violation.ControlName),
            .. manifest.Policy.Notes,
            .. manifest.UnresolvedIssues.Items.Select(static issue => issue.Description),
            .. manifest.UnresolvedIssues.Items.Select(static issue => issue.Title),
            .. manifest.Requirements.Uncovered
                .Where(static item => item.IsMandatory)
                .Select(static item => item.RequirementText),
        ];

        return AuthorityInvariantKeyExtractor.ExtractDistinctInvariantKeys(segments.ToArray());
    }

    private static void EnrichTrailFromManifest(ManifestDocument manifest, TransparencyTrail trail)
    {
        foreach (PolicyControlItem violation in manifest.Policy.Violations)
        {
            string key = string.IsNullOrWhiteSpace(violation.ControlId)
                ? $"policy.violation.{violation.ControlName}"
                : $"policy.violation.{violation.ControlId}";

            UpsertInferred(trail, key, violation.ControlName, 85);
        }

        foreach (ManifestIssue issue in manifest.UnresolvedIssues.Items)
            UpsertInferred(trail, $"manifest.issue.{issue.IssueType}", issue.Title, 70);

        foreach (RequirementCoverageItem uncovered in manifest.Requirements.Uncovered.Where(static item => item.IsMandatory))
            UpsertInferred(trail, $"requirement.uncovered.{uncovered.RequirementName}", uncovered.RequirementText, 75);
    }

    private static void UpsertInferred(TransparencyTrail trail, string key, string value, int confidence)
    {
        if (string.IsNullOrWhiteSpace(key) || string.IsNullOrWhiteSpace(value))
            return;

        InferredTrailEntry? existing = trail.Inferred.Find(entry =>
            string.Equals(entry.Key, key, StringComparison.OrdinalIgnoreCase));

        if (existing is not null)
        {
            existing.Value = value.Trim();
            existing.Confidence = confidence;
            return;
        }

        trail.Inferred.Add(
            new InferredTrailEntry
            {
                Key = key.Trim(),
                Value = value.Trim(),
                Confidence = confidence,
            });
    }

    private static TransparencyTrail? CloneTrail(TransparencyTrail? source)
    {
        if (source is null)
            return null;

        string json = JsonSerializer.Serialize(source, TrailCloneOptions);
        return JsonSerializer.Deserialize<TransparencyTrail>(json, TrailCloneOptions);
    }
}
