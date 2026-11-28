using ArchLucid.Application.Analysis;
using ArchLucid.Contracts.Agents;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Manifest;
using ArchLucid.Persistence.Queries;

namespace ArchLucid.Application.Replay.Historical;

/// <summary>Bind the descriptor to existing scoped source records without changing legacy hash projections or snapshot identities.</summary>
public static class HistoricalReplaySourceAnchors
{
    public const string AuthorityManifestScheme = "archlucid-authority-manifest";
    public const string SecureNowInventoryScheme = "securenow-inventory-content";

    public static HistoricalSourceAnchor? TryBindAuthority(HistoricalRunIdentity authorized, RunDetailDto stored,
        IManifestHashService manifestHasher)
    {
        ArgumentNullException.ThrowIfNull(authorized);
        ArgumentNullException.ThrowIfNull(stored);
        ArgumentNullException.ThrowIfNull(manifestHasher);
        if (authorized.Product != HistoricalReplayProduct.ArchLucid || authorized.RunId == Guid.Empty
            || stored.Run is not { } run || stored.GoldenManifest is not { } manifest
            || run.RunId != authorized.RunId || manifest.RunId != authorized.RunId
            || !authorized.Scope.Matches(run.TenantId, run.WorkspaceId, run.ScopeProjectId)
            || !authorized.Scope.Matches(manifest.TenantId, manifest.WorkspaceId, manifest.ProjectId)
            || manifest.ManifestId == Guid.Empty || manifest.ManifestId != run.GoldenManifestId
            || (authorized.SnapshotId is Guid snapshotId
                && (snapshotId != run.FindingsSnapshotId || snapshotId != manifest.FindingsSnapshotId))
            || (run.DecisionTraceId is Guid traceId && traceId != manifest.DecisionTraceId)
            || !HistoricalReplayDescriptorValidation.IsHash(manifest.ManifestHash)
            || !string.Equals(manifestHasher.ComputeHash(manifest), manifest.ManifestHash, StringComparison.OrdinalIgnoreCase))
            return null;

        return new(authorized, AuthorityManifestScheme, manifest.ManifestId, manifest.ManifestHash.ToUpperInvariant())
        {
            RecordedCaptureCoverage = stored.DegradedFindingCoverage ? HistoricalCoverage.Partial : null,
            EvidencePackagePinSha256 = run.PinnedEvidencePackagePinsHashSha256 is { Length: 32 } evidence ? Convert.ToHexString(evidence) : null,
            PolicyPackPinSha256 = run.PinnedPolicyPackIdsHashSha256 is { Length: 32 } policy ? Convert.ToHexString(policy) : null,
        };
    }

    /// <summary>Project only reviewed attempt metadata. A trace or blob pointer never proves full retained bytes.</summary>
    public static HistoricalAcceptedAttempt? TryBindAcceptedTrace(HistoricalRunIdentity run, string expectedTaskId,
        string acceptedTraceId, int attemptIndex, AgentExecutionTrace trace, string? provider = null)
    {
        ArgumentNullException.ThrowIfNull(run);
        ArgumentNullException.ThrowIfNull(trace);
        if (!Guid.TryParse(trace.RunId, out var traceRun) || traceRun != run.RunId || attemptIndex < 0
            || string.IsNullOrWhiteSpace(expectedTaskId) || string.IsNullOrWhiteSpace(acceptedTraceId)
            || trace.TaskId != expectedTaskId || trace.TraceId != acceptedTraceId || trace.AttemptIndex != attemptIndex
            || trace.QualityRejected || !trace.ParseSucceeded || string.IsNullOrWhiteSpace(trace.ParsedResultJson))
            return null;

        var temperature = trace.CompletionTemperature;
        var topP = trace.CompletionTopP;
        var maxTokens = trace.MaxCompletionTokens;
        bool settingsRecorded = (temperature.HasValue || topP.HasValue || maxTokens.HasValue)
            && (temperature is not float t || float.IsFinite(t)) && (topP is not float p || float.IsFinite(p));
        string? parameters = settingsRecorded
            ? AnalysisDependencyFingerprint.Digest(new { temperature, topP, maxTokens }) : null;
        return new(acceptedTraceId, trace.PromptTemplateId, trace.PromptTemplateVersion, provider,
            trace.ModelDeploymentName, parameters, trace.QualityWarning
                ? HistoricalAttemptDisposition.AcceptedWithWarning : HistoricalAttemptDisposition.Accepted)
        {
            ModelVersion = trace.ModelVersion,
            PromptContentSha256 = HistoricalReplayDescriptorValidation.IsHash(trace.SystemPromptContentSha256)
                ? trace.SystemPromptContentSha256 : null,
            RecordedAttemptIndex = attemptIndex,
        };
    }

    public static HistoricalSourceAnchor? TryBindSecureNow(HistoricalRunIdentity authorized, AzureInventorySnapshotRecord snapshot)
    {
        ArgumentNullException.ThrowIfNull(authorized);
        ArgumentNullException.ThrowIfNull(snapshot);
        if (authorized.Product != HistoricalReplayProduct.SecureNow || authorized.RunId == Guid.Empty || snapshot.SnapshotId == Guid.Empty
            || authorized.SnapshotId != snapshot.SnapshotId
            || !authorized.Scope.Matches(snapshot.TenantId, snapshot.WorkspaceId, snapshot.ProjectId)
            || snapshot.ContentHashSha256 is not { Length: 32 } hash)
            return null;

        // Inventory identity does not authenticate the run or finding by itself. The separate trusted descriptor commitment
        // binds the original run/finding and final output artifact to this verified scoped capture.
        return new(authorized, SecureNowInventoryScheme, snapshot.SnapshotId, Convert.ToHexString(hash))
        {
            RecordedCaptureCoverage = snapshot is { CaptureStatus: AzureInventoryCaptureStatus.Succeeded,
                CapturedUtc: not null, CompletenessScore: 1m, WarningCount: 0, ErrorCount: 0 }
                ? HistoricalCoverage.Complete : HistoricalCoverage.Partial,
        };
    }
}
