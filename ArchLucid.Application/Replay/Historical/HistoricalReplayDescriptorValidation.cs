using ArchLucid.Application.Analysis;

namespace ArchLucid.Application.Replay.Historical;

internal static class HistoricalReplayDescriptorValidation
{
    internal const int MaxArtifacts = 384;
    internal const long MaxArtifactBytes = 64L * 1024 * 1024;
    internal const long MaxReadBytes = 256L * 1024 * 1024;
    private const int MaxStages = 128;
    private const int MaxDependencies = 32;

    internal static string Digest(HistoricalReplayDescriptor normalized) =>
        AnalysisDependencyFingerprint.Digest(new { Kind = "historical-replay-descriptor-v1", Descriptor = normalized });

    internal static bool IsHash(string? hash) => hash is { Length: 64 } && hash.All(Uri.IsHexDigit);
    internal static bool SameHash(string? a, string? b) => string.Equals(a, b, StringComparison.OrdinalIgnoreCase);

    internal static bool ValidAnchor(HistoricalSourceAnchor? anchor) =>
        anchor is { Run: { Scope: not null } run } && anchor.SourceRecordId != Guid.Empty
        && run.RunId != Guid.Empty && run.SnapshotId != Guid.Empty && run.FindingId != Guid.Empty
        && (anchor.EvidencePackagePinSha256 is null || IsHash(anchor.EvidencePackagePinSha256))
        && (anchor.PolicyPackPinSha256 is null || IsHash(anchor.PolicyPackPinSha256))
        && IsHash(anchor.CommitmentSha256) && (!anchor.RecordedCaptureCoverage.HasValue || Enum.IsDefined(anchor.RecordedCaptureCoverage.Value))
        && (run.Product switch
        {
            HistoricalReplayProduct.ArchLucid => anchor.Scheme == HistoricalReplaySourceAnchors.AuthorityManifestScheme,
            HistoricalReplayProduct.SecureNow => anchor.Scheme == HistoricalReplaySourceAnchors.SecureNowInventoryScheme
                && run.SnapshotId == anchor.SourceRecordId,
            _ => false,
        });

    internal static bool EqualAnchors(HistoricalSourceAnchor a, HistoricalSourceAnchor b) =>
        a.Run == b.Run && a.Scheme == b.Scheme && a.SourceRecordId == b.SourceRecordId
        && a.RecordedCaptureCoverage == b.RecordedCaptureCoverage && SameHash(a.CommitmentSha256, b.CommitmentSha256)
        && SameHash(a.EvidencePackagePinSha256, b.EvidencePackagePinSha256) && SameHash(a.PolicyPackPinSha256, b.PolicyPackPinSha256);

    internal static HistoricalReplayDescriptor? Freeze(HistoricalReplayDescriptor raw)
    {
        if (!ValidAnchor(raw.Source) || raw.RecordedUtc == default || !Enum.IsDefined(raw.SourceCoverage)
            || (raw.Source.RecordedCaptureCoverage is HistoricalCoverage.Partial or HistoricalCoverage.Unknown
                && raw.SourceCoverage == HistoricalCoverage.Complete)
            || !ValidVersions(raw.Versions))
            return null;

        var stages = Rows(raw.Stages, MaxStages);
        var artifacts = Rows(raw.Artifacts, MaxArtifacts);
        if (stages is null || artifacts is null)
            return null;

        Dictionary<string, HistoricalStagePin> stageMap = new(StringComparer.Ordinal);
        foreach (var stage in stages)
        {
            if (stage is null || !Token(stage.StageId) || !Enum.IsDefined(stage.Kind) || !Enum.IsDefined(stage.Coverage))
                return null;
            var identifiers = Rows(stage.Dependencies, MaxDependencies);
            if (identifiers is null || identifiers.Any(id => !Token(id)) || !Unique(identifiers)
                || !ValidAttempt(stage) || !stageMap.TryAdd(stage.StageId, stage with
                {
                    RecordedUtc = stage.RecordedUtc?.ToUniversalTime(),
                    Dependencies = FreezeRows(identifiers.Order(StringComparer.Ordinal)),
                    AcceptedAttempt = stage.AcceptedAttempt is { } attempt
                        ? attempt with
                        {
                            ParametersSha256 = attempt.ParametersSha256?.ToUpperInvariant(),
                            PromptContentSha256 = attempt.PromptContentSha256?.ToUpperInvariant(),
                        } : null,
                }))
                return null;
        }

        if (!HasClosedAcyclicLineage(stageMap))
            return null;

        List<HistoricalArtifactPin> pinned = [];
        HashSet<string> seen = new(StringComparer.Ordinal);
        foreach (var artifact in artifacts)
        {
            if (artifact is null || !Token(artifact.ArtifactId) || !seen.Add(artifact.ArtifactId) || !Token(artifact.Schema)
                || !Enum.IsDefined(artifact.Role) || !Enum.IsDefined(artifact.RecordedAvailability)
                || artifact.RecordedAvailability == HistoricalArtifactAvailability.NotChecked
                || (artifact.AdditionalRequirements & ~HistoricalRequiredModes.All) != 0
                || (artifact.Length is < 0 or > MaxArtifactBytes)
                || (artifact.Sha256 is not null && !IsHash(artifact.Sha256))
                || (artifact.RecordedAvailability == HistoricalArtifactAvailability.Exact
                    && (artifact.Sha256 is null || artifact.Length is null))
                || !ValidArtifactLineage(artifact, stageMap))
                return null;

            pinned.Add(artifact with { Sha256 = artifact.Sha256?.ToUpperInvariant(), CapturedUtc = artifact.CapturedUtc?.ToUniversalTime() });
        }

        return raw with
        {
            Source = raw.Source with
            {
                CommitmentSha256 = raw.Source.CommitmentSha256.ToUpperInvariant(),
                EvidencePackagePinSha256 = raw.Source.EvidencePackagePinSha256?.ToUpperInvariant(),
                PolicyPackPinSha256 = raw.Source.PolicyPackPinSha256?.ToUpperInvariant(),
            },
            RecordedUtc = raw.RecordedUtc.ToUniversalTime(),
            Stages = FreezeRows(stageMap.Values.OrderBy(row => row.StageId, StringComparer.Ordinal)),
            Artifacts = FreezeRows(pinned.OrderBy(row => row.ArtifactId, StringComparer.Ordinal)),
        };
    }

    internal static IReadOnlyList<T> FreezeRows<T>(IEnumerable<T> values) => Array.AsReadOnly(values.ToArray());

    private static bool ValidArtifactLineage(HistoricalArtifactPin item, Dictionary<string, HistoricalStagePin> stages)
    {
        HistoricalStagePin? owner = null;
        if (item.StageId is not null && (!Token(item.StageId) || !stages.TryGetValue(item.StageId, out owner)))
            return false;

        if (item.Role is HistoricalArtifactRole.AcceptedTypedInput or HistoricalArtifactRole.AcceptedRawResponse
                or HistoricalArtifactRole.AcceptedPrompt or HistoricalArtifactRole.ExternalToolResult)
        {
            var kind = item.Role == HistoricalArtifactRole.ExternalToolResult ? HistoricalStageKind.ExternalTool : HistoricalStageKind.Model;
            return owner?.Kind == kind && owner.AcceptedAttempt is { } attempt
                && string.Equals(attempt.Id, item.AttemptId, StringComparison.Ordinal);
        }

        return item.AttemptId is null && (item.Role != HistoricalArtifactRole.StageOutput || owner is not null);
    }

    private static bool ValidAttempt(HistoricalStagePin stage)
    {
        if (stage.AcceptedAttempt is not { } attempt)
            return true; // Retain incomplete lineage, but the replay readiness check does not infer an accepted attempt.
        return stage.Kind != HistoricalStageKind.Deterministic && Token(attempt.Id) && Enum.IsDefined(attempt.ValidationDisposition)
            && OptionalToken(attempt.PromptTemplate) && OptionalToken(attempt.PromptTemplateVersion)
            && OptionalToken(attempt.Provider) && OptionalToken(attempt.ModelDeployment) && OptionalToken(attempt.ModelVersion)
            && attempt.RecordedAttemptIndex is not < 0
            && (attempt.PromptContentSha256 is null || IsHash(attempt.PromptContentSha256))
            && (attempt.ParametersSha256 is null || IsHash(attempt.ParametersSha256));
    }

    private static bool ValidVersions(HistoricalExecutionVersions? versions) => versions is null
        || (Token(versions.EngineBuild) && Token(versions.RuntimeVersion) && Token(versions.DependencyVersion)
            && Token(versions.ConfigurationVersion) && Token(versions.OutputSchema) && Token(versions.CanonicalizationVersion));

    private static bool HasClosedAcyclicLineage(Dictionary<string, HistoricalStagePin> stages)
    {
        var resolved = new HashSet<string>(StringComparer.Ordinal);
        while (resolved.Count < stages.Count)
        {
            int before = resolved.Count;
            foreach (var stage in stages.Values)
            {
                if (stage.Dependencies.All(resolved.Contains))
                    resolved.Add(stage.StageId);
            }
            if (before == resolved.Count)
                return false;
        }
        return true;
    }

    private static T[]? Rows<T>(IReadOnlyList<T>? source, int max)
    {
        if (source is null || source.Count > max)
            return null;
        var values = source.Take(max + 1).ToArray();
        return values.Length <= max ? values : null;
    }

    private static bool Token(string? value) => value is { Length: > 0 and <= 192 } && !string.IsNullOrWhiteSpace(value)
        && string.Equals(value, value.Trim(), StringComparison.Ordinal) && !value.Any(char.IsControl);
    private static bool OptionalToken(string? value) => value is null || Token(value);
    private static bool Unique(IEnumerable<string> values) => values.Distinct(StringComparer.Ordinal).Count() == values.Count();
}
