using System.Text.Json;

using ArchLucid.Application.Analysis;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence.RemediationPortfolio;

/// <summary>Reads evidence already produced by the existing remediation verification flow. No remediation or status writes.</summary>
public sealed class PortfolioEffectivenessReader(IRemediationInstanceRepository instances, IAzureInventorySnapshotRepository snapshots)
{
    public const string Version = "FND093-observed-portfolio-effectiveness-v1";
    private const int MaxScenarios = 2_048;
    private const int MaxVerificationJson = 32_768;

    public static string ModeledImpactSha256(PortfolioImpactResult modeled) =>
        AnalysisDependencyFingerprint.Digest(new { Version, Modeled = modeled });

    public static string ReviewSha256(PortfolioEffectivenessReview review) =>
        Digest(Freeze(review) ?? throw new ArgumentException("Invalid effectiveness review.", nameof(review)));

    public async Task<PortfolioEffectivenessResult> ReadAsync(PortfolioOptimizationPin authorized, RemediationPortfolioGraph graph,
        PortfolioImpactPlan plan, PortfolioImpactResult modeled, PortfolioEffectivenessReview review, string independentlyReviewedSha256,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(authorized);
        ArgumentNullException.ThrowIfNull(graph);
        ArgumentNullException.ThrowIfNull(plan);
        ArgumentNullException.ThrowIfNull(modeled);
        ArgumentNullException.ThrowIfNull(review);
        cancellationToken.ThrowIfCancellationRequested();

        var frozen = Freeze(review);
        if (modeled.Scenarios is null || modeled.Scenarios.Count is < 1 or > MaxScenarios
            || modeled.Scenarios.Any(row => row is null || !ValidId(row.ScenarioId) || !Enum.IsDefined(row.Baseline) || !Enum.IsDefined(row.Proposed)
                || row.Observations is null || row.Observations.Count > 1_024))
            return Reject(authorized, "modeled", "malformed_modeled_evidence");
        modeled = modeled with { Scenarios = RemediationPortfolioGraph.Freeze(modeled.Scenarios.Select(
            row => row with { Observations = RemediationPortfolioGraph.Freeze(row.Observations) })) };
        var selected = PortfolioImpactInputs.FreezePlan(plan);
        var project = authorized.Binding.Scope.Project;
        Guid baselineId = authorized.Binding.Scope.SnapshotId;
        if (frozen is null || selected is null || authorized != new PortfolioOptimizationPin(graph.Binding, graph.GraphSha256)
            || selected.Portfolio != authorized || frozen.Portfolio != authorized || frozen.LaterSnapshotId == baselineId
            || !PortfolioImpactInputs.Hash(independentlyReviewedSha256) || !EqualHash(Digest(frozen), independentlyReviewedSha256)
            || modeled.Version != RemediationPortfolioImpactEvaluator.Version || !modeled.FullComparisonPassed
            || modeled.Status is not (PortfolioImpactStatus.Modeled or PortfolioImpactStatus.IncompleteCoverage)
            || !EqualHash(frozen.ModeledImpactSha256, ModeledImpactSha256(modeled))
            || !EqualHash(frozen.PlanSha256, RemediationPortfolioImpactEvaluator.PlanSha256(selected))
            || !EqualHash(frozen.PlanSha256, modeled.PlanSha256)
            || selected.SelectedActionIds.Count == 0 || !graph.EvaluateSelection(selected.SelectedActionIds).Feasible)
            return Reject(authorized, "pin", "review_scope_plan_or_modeled_evidence_mismatch");

        string digest = Digest(frozen);
        var actionRows = graph.Actions.ToDictionary(item => item.Id, StringComparer.Ordinal);
        var scenarioIds = modeled.Scenarios.Select(item => item.ScenarioId).ToHashSet(StringComparer.Ordinal);
        if (!selected.SelectedActionIds.SequenceEqual(frozen.Actions.Select(row => row.ActionId), StringComparer.Ordinal)
            || scenarioIds.Count != modeled.Scenarios.Count || frozen.Observations.Any(row => !scenarioIds.Contains(row.ScenarioId)))
            return Reject(authorized, "review", "receipt_roster_does_not_match_reviewed_plan");

        var scope = new ScopeContext { TenantId = project.TenantId, WorkspaceId = project.WorkspaceId, ProjectId = project.ProjectId };
        var baseline = await snapshots.TryGetBySnapshotIdAsync(scope, baselineId, cancellationToken);
        var later = await snapshots.TryGetBySnapshotIdAsync(scope, frozen.LaterSnapshotId, cancellationToken);
        if (Foreign(baseline, project, baselineId) || Foreign(later, project, frozen.LaterSnapshotId))
            return Reject(authorized, "snapshot", "repository_returned_out_of_scope_snapshot");
        if (!Complete(baseline, authorized.Binding.InventorySha256) || !Complete(later, frozen.LaterInventorySha256)
            || later!.CapturedUtc <= baseline!.CapturedUtc)
            return Unknown(authorized, frozen.LaterSnapshotId, digest, modeled, "missing_stale_incomplete_or_changed_snapshot");

        DateTime before = baseline!.CapturedUtc!.Value;
        DateTime after = later.CapturedUtc!.Value;
        bool allApplied = true;
        List<PortfolioVerifiedActionReceipt> receipts = [];
        foreach (var link in frozen.Actions)
        {
            cancellationToken.ThrowIfCancellationRequested();
            var action = actionRows[link.ActionId];
            var instance = await instances.TryGetByIdInScopeAsync(project, link.InstanceId, cancellationToken);
            if (instance is not null && (!project.Matches(instance.TenantId, instance.WorkspaceId, instance.ProjectId)
                || instance.InstanceId != link.InstanceId || instance.PatternId != action.PatternId
                || instance.PatternVersionId != action.PatternVersionId || instance.CloudResourceId != action.TargetResourceId
                || !action.FindingIds.Contains(instance.FindingId)))
                return Reject(authorized, "receipt", "instance_scope_or_action_identity_mismatch");

            bool applied = instance is { Status: RemediationInstanceStatus.ChangeImplemented or RemediationInstanceStatus.Verified
                    or RemediationInstanceStatus.VerificationFailed or RemediationInstanceStatus.Closed,
                ApprovedUtc: not null, ChangeImplementedUtc: not null }
                && !string.IsNullOrWhiteSpace(instance.ApprovedByActorKey) && instance.ExecutionSnapshotId == baselineId
                && instance.ApprovedUtc <= instance.ChangeImplementedUtc && instance.ChangeImplementedUtc >= before
                && instance.ChangeImplementedUtc < after;
            allApplied &= applied;
            if (applied && VerifiedReceipt(instance!, baselineId, frozen.LaterSnapshotId, before, after))
                receipts.Add(new(link.ActionId, link.InstanceId,
                    AnalysisDependencyFingerprint.Digest(new
                    {
                        Version, instance!.InstanceId, instance.VerificationSnapshotId, instance.VerifiedUtc, instance.VerificationResultJson,
                    })));
        }

        if (!allApplied)
            return Unknown(authorized, frozen.LaterSnapshotId, digest, modeled, "approval_or_application_not_evidenced");

        cancellationToken.ThrowIfCancellationRequested();
        var observations = frozen.Observations.ToDictionary(row => row.ScenarioId, StringComparer.Ordinal);
        bool allVerified = receipts.Count == frozen.Actions.Count;
        var result = RemediationPortfolioGraph.Freeze(modeled.Scenarios.OrderBy(row => row.ScenarioId, StringComparer.Ordinal).Select(row =>
        {
            observations.TryGetValue(row.ScenarioId, out var evidence);
            // A later positive witness can contradict modeled removal even if the existing instance verification failed.
            // Absence requires the completed existing verification flow in addition to an independent observation.
            var observed = evidence?.State ?? PortfolioExposureState.Unknown;
            if (observed == PortfolioExposureState.AbsentWithinCoverage && !allVerified)
                observed = PortfolioExposureState.Unknown;
            var comparison = observed == PortfolioExposureState.Unknown || row.Proposed == PortfolioExposureState.Unknown
                ? PortfolioObservedComparison.Unknown
                : observed == row.Proposed ? PortfolioObservedComparison.Agrees : PortfolioObservedComparison.Contradicts;
            return new PortfolioObservedScenario(row.ScenarioId, row.Baseline, row.Proposed, observed, comparison,
                observed == PortfolioExposureState.Unknown ? null : evidence!.EvidenceSha256);
        }));
        bool incomplete = result.Any(row => row.Comparison == PortfolioObservedComparison.Unknown);
        return new(Version, authorized, incomplete ? PortfolioEffectivenessStatus.Inconclusive : PortfolioEffectivenessStatus.Measured,
            digest, frozen.LaterSnapshotId, result,
            incomplete ? Array.AsReadOnly(new PortfolioIssue[] { new("observation", "scenario_or_verified_absence_unestablished") }) : [])
        {
            VerifiedActionReceipts = RemediationPortfolioGraph.Freeze(receipts),
        };
    }

    private static bool VerifiedReceipt(RemediationInstanceRecord instance, Guid baselineId, Guid laterId, DateTime before, DateTime after)
    {
        if (instance.Status is not (RemediationInstanceStatus.Verified or RemediationInstanceStatus.Closed)
            || instance.VerificationSnapshotId != laterId || instance.VerifiedUtc is not DateTime verifiedUtc || verifiedUtc < after
            || instance.VerificationResultJson is not { Length: > 0 and <= MaxVerificationJson } json)
            return false;
        try
        {
            using var document = JsonDocument.Parse(json, new JsonDocumentOptions { MaxDepth = 16 });
            var fields = document.RootElement;
            if (fields.ValueKind != JsonValueKind.Object
                || fields.EnumerateObject().Select(item => item.Name).Distinct(StringComparer.Ordinal).Count()
                   != fields.EnumerateObject().Count())
                return false;
            return fields.TryGetProperty("passed", out var passed) && passed.ValueKind == JsonValueKind.True
                && fields.TryGetProperty("failures", out var failures) && failures.ValueKind == JsonValueKind.Array && failures.GetArrayLength() == 0
                && GuidField(fields, "executionSnapshotId", baselineId) && GuidField(fields, "verificationSnapshotId", laterId)
                && DateField(fields, "executionCapturedUtc", before) && DateField(fields, "verificationCapturedUtc", after)
                && DateField(fields, "changeImplementedUtc", instance.ChangeImplementedUtc!.Value);
        }
        catch (JsonException)
        {
            return false;
        }
    }

    private static bool GuidField(JsonElement value, string key, Guid expected) =>
        value.TryGetProperty(key, out var field) && field.ValueKind == JsonValueKind.String
        && field.TryGetGuid(out var actual) && actual == expected;

    private static bool DateField(JsonElement value, string key, DateTime expected) =>
        value.TryGetProperty(key, out var field) && field.ValueKind == JsonValueKind.String
        && field.TryGetDateTime(out var actual) && actual == expected;

    private static bool Foreign(AzureInventorySnapshotRecord? snapshot, ProjectScopeKey scope, Guid id) =>
        snapshot is not null && (snapshot.SnapshotId != id || !scope.Matches(snapshot.TenantId, snapshot.WorkspaceId, snapshot.ProjectId));

    private static bool Complete(AzureInventorySnapshotRecord? value, string hash) =>
        value is { CaptureStatus: AzureInventoryCaptureStatus.Succeeded, CapturedUtc: not null, CompletenessScore: 1m,
            WarningCount: 0, ErrorCount: 0, ContentHashSha256.Length: 32 }
        && EqualHash(Convert.ToHexString(value.ContentHashSha256), hash);

    private static string Digest(PortfolioEffectivenessReview frozen) =>
        AnalysisDependencyFingerprint.Digest(new { Version, Review = frozen });

    private static bool EqualHash(string one, string? other) => string.Equals(one, other, StringComparison.OrdinalIgnoreCase);

    private static PortfolioEffectivenessReview? Freeze(PortfolioEffectivenessReview review)
    {
        if (review.Actions is null || review.Observations is null || review.LaterSnapshotId == Guid.Empty
            || !PortfolioImpactInputs.Hash(review.PlanSha256) || !PortfolioImpactInputs.Hash(review.ModeledImpactSha256)
            || !PortfolioImpactInputs.Hash(review.LaterInventorySha256))
            return null;
        var actions = review.Actions.Take(RemediationPortfolioGraphBuilder.MaxActions + 1).ToArray();
        var observations = review.Observations.Take(MaxScenarios + 1).ToArray();
        if (actions.Length > RemediationPortfolioGraphBuilder.MaxActions || observations.Length > MaxScenarios
            || actions.Any(row => row is null || !ValidId(row.ActionId) || row.InstanceId == Guid.Empty)
            || actions.Select(row => row.ActionId).Distinct(StringComparer.Ordinal).Count() != actions.Length
            || actions.Select(row => row.InstanceId).Distinct().Count() != actions.Length
            || observations.Any(row => row is null || !ValidId(row.ScenarioId) || !Enum.IsDefined(row.State)
                || !PortfolioImpactInputs.Hash(row.EvidenceSha256))
            || observations.Select(row => row.ScenarioId).Distinct(StringComparer.Ordinal).Count() != observations.Length)
            return null;
        return review with
        {
            Actions = RemediationPortfolioGraph.Freeze(actions.OrderBy(row => row.ActionId, StringComparer.Ordinal)),
            Observations = RemediationPortfolioGraph.Freeze(observations.OrderBy(row => row.ScenarioId, StringComparer.Ordinal)
                .Select(row => row with { EvidenceSha256 = row.EvidenceSha256.ToUpperInvariant() })),
            LaterInventorySha256 = review.LaterInventorySha256.ToUpperInvariant(),
            PlanSha256 = review.PlanSha256.ToUpperInvariant(),
            ModeledImpactSha256 = review.ModeledImpactSha256.ToUpperInvariant(),
        };
    }

    private static bool ValidId(string? id) => id is { Length: > 0 and <= 192 } && !string.IsNullOrWhiteSpace(id);

    private static PortfolioEffectivenessResult Reject(PortfolioOptimizationPin pin, string subject, string reason) =>
        new(Version, pin, PortfolioEffectivenessStatus.Rejected, null, null, [], Array.AsReadOnly(new PortfolioIssue[] { new(subject, reason) }));

    private static PortfolioEffectivenessResult Unknown(PortfolioOptimizationPin pin, Guid laterId, string digest,
        PortfolioImpactResult modeled, string reason) => new(Version, pin, PortfolioEffectivenessStatus.Inconclusive, digest, laterId,
        RemediationPortfolioGraph.Freeze(modeled.Scenarios.OrderBy(row => row.ScenarioId, StringComparer.Ordinal)
            .Select(row => new PortfolioObservedScenario(row.ScenarioId, row.Baseline, row.Proposed, PortfolioExposureState.Unknown,
                PortfolioObservedComparison.Unknown, null))),
        Array.AsReadOnly(new PortfolioIssue[] { new("verification", reason) }));
}
