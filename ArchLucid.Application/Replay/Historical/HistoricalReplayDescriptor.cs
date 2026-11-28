using System.Text.Json.Serialization;

using ArchLucid.Core.Scoping;

namespace ArchLucid.Application.Replay.Historical;

public enum HistoricalReplayProduct { ArchLucid, SecureNow }
public enum HistoricalReplayMode { Reconstruction, RecordedTyped, RecordedRaw }

[Flags]
public enum HistoricalRequiredModes { None = 0, Reconstruction = 1, RecordedTyped = 2, RecordedRaw = 4, All = 7 }

public enum HistoricalCoverage { Unknown, Partial, Complete }
public enum HistoricalStageKind { Deterministic, Model, ExternalTool }
public enum HistoricalAttemptDisposition { Unknown, Accepted, AcceptedWithWarning }
public enum HistoricalArtifactRole
{
    SourceEvidence, GraphSnapshot, EffectivePolicy, ExceptionOrAssetAssertions, Configuration, Executable, RuntimeDependencies,
    AcceptedTypedInput, AcceptedRawResponse, AcceptedPrompt, ExternalToolResult, StageOutput, Checkpoint,
    DecisionTrace, IndependentVerification, HumanDecision, OriginalOutput,
}

public enum HistoricalArtifactAvailability
{
    Unknown, Exact, Derived, Redacted, Truncated, Missing, Expired, Erased, Tampered, Incompatible, AccessDenied, NotChecked,
}

public enum HistoricalReplayReadiness { Ready, Partial, Unavailable, Rejected, LegacyDescriptorUnavailable }

public sealed record HistoricalRunIdentity
{
    public HistoricalRunIdentity(ProjectScopeKey scope, HistoricalReplayProduct product, Guid runId, Guid? snapshotId, Guid? findingId)
    {
        Scope = scope ?? throw new ArgumentNullException(nameof(scope));
        Product = product;
        RunId = runId;
        SnapshotId = snapshotId;
        FindingId = findingId;
    }

    [JsonConstructor]
    public HistoricalRunIdentity(Guid tenantId, Guid workspaceId, Guid projectId, HistoricalReplayProduct product,
        Guid runId, Guid? snapshotId, Guid? findingId)
        : this(ProjectScopeKey.Create(tenantId, workspaceId, projectId), product, runId, snapshotId, findingId)
    {
    }

    [JsonIgnore]
    public ProjectScopeKey Scope { get; }
    public Guid TenantId => Scope.TenantId;
    public Guid WorkspaceId => Scope.WorkspaceId;
    public Guid ProjectId => Scope.ProjectId;
    public HistoricalReplayProduct Product { get; }
    public Guid RunId { get; }
    public Guid? SnapshotId { get; }
    public Guid? FindingId { get; }
}

/// <summary>Existing product commitment. It is not necessarily the SHA-256 of any serialized artifact.</summary>
public sealed record HistoricalSourceAnchor(HistoricalRunIdentity Run, string Scheme, Guid SourceRecordId, string CommitmentSha256)
{
    public HistoricalCoverage? RecordedCaptureCoverage { get; init; }
    public string? EvidencePackagePinSha256 { get; init; }
    public string? PolicyPackPinSha256 { get; init; }
}

/// <summary>Supplied independently by an authorized commitment reader, never recovered from an untrusted descriptor.</summary>
public sealed record HistoricalReplayTrust(HistoricalSourceAnchor Source, string? DescriptorSha256);

public sealed record HistoricalExecutionVersions(string EngineBuild, string RuntimeVersion, string DependencyVersion,
    string ConfigurationVersion, string OutputSchema, string CanonicalizationVersion);

public sealed record HistoricalAcceptedAttempt(string Id, string? PromptTemplate, string? PromptTemplateVersion, string? Provider,
    string? ModelDeployment, string? ParametersSha256, HistoricalAttemptDisposition ValidationDisposition)
{
    public string? ModelVersion { get; init; }
    public string? PromptContentSha256 { get; init; }
    public int? RecordedAttemptIndex { get; init; }
}

public sealed record HistoricalStagePin(string StageId, HistoricalStageKind Kind, HistoricalCoverage Coverage,
    DateTimeOffset? RecordedUtc, IReadOnlyList<string> Dependencies, HistoricalAcceptedAttempt? AcceptedAttempt);

public sealed record HistoricalArtifactPin(string ArtifactId, HistoricalArtifactRole Role, string Schema,
    string? StageId, string? AttemptId, string? Sha256, long? Length, DateTimeOffset? CapturedUtc,
    HistoricalArtifactAvailability RecordedAvailability, HistoricalRequiredModes AdditionalRequirements);

public sealed record HistoricalReplayDescriptor(int Version, HistoricalSourceAnchor Source, DateTimeOffset RecordedUtc,
    HistoricalCoverage SourceCoverage, HistoricalExecutionVersions? Versions,
    IReadOnlyList<HistoricalStagePin> Stages, IReadOnlyList<HistoricalArtifactPin> Artifacts);

public sealed record HistoricalArtifactIdentity(HistoricalRunIdentity Run, string ArtifactId, HistoricalArtifactRole Role,
    string Schema, string? StageId, string? AttemptId);

public sealed record HistoricalArtifactRead(HistoricalArtifactIdentity Identity, HistoricalArtifactAvailability Availability, Stream? Content);

/// <summary>Adapter over existing, already authorized immutable artifact reads. Transfers ownership of any returned stream.</summary>
public interface IScopedHistoricalArtifactReader
{
    ValueTask<HistoricalArtifactRead?> OpenReadAsync(HistoricalArtifactIdentity identity, CancellationToken cancellationToken);
}

public sealed record HistoricalArtifactCheck(string ArtifactId, HistoricalArtifactRole Role, bool Required,
    HistoricalArtifactAvailability RecordedAvailability, HistoricalArtifactAvailability ObservedAvailability);

public sealed record HistoricalReplayIssue(string Subject, string Reason);

/// <summary>Integrity and artifact readiness only. Never an assertion about replay equivalence or historical correctness.</summary>
public sealed record HistoricalReplayAssessment(HistoricalReplayMode Mode, HistoricalReplayReadiness Status, string? DescriptorSha256,
    HistoricalCoverage SourceCoverage, IReadOnlyList<HistoricalArtifactCheck> Artifacts, IReadOnlyList<HistoricalReplayIssue> Issues);
