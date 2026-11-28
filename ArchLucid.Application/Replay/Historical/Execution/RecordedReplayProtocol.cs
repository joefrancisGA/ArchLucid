using System.Text.Json;

namespace ArchLucid.Application.Replay.Historical.Execution;

/// <summary>An independently approved, preloaded immutable image for the exact product, versions and mode.</summary>
public sealed record RecordedReplayImage(HistoricalReplayProduct Product, HistoricalReplayMode Mode,
    HistoricalExecutionVersions Versions, string ImageId);

public enum RecordedReplayOutcome { Rejected, Partial, Unavailable, ReproducedWithinScope, DriftDetected }

public sealed record RecordedReplayComparison(string Subject, bool Matches);

public sealed record RecordedReplayResult(RecordedReplayOutcome Outcome, HistoricalReplayMode Mode,
    string Reason, HistoricalReplayAssessment? Assessment = null, Guid? AuditId = null,
    IReadOnlyList<RecordedReplayComparison>? Comparisons = null);

/// <summary>Only the selected recipe's authorized inputs are passed to the isolated worker.</summary>
public sealed record RecordedReplayWorkerInput(HistoricalRunIdentity Run, HistoricalReplayMode Mode,
    DateTimeOffset RecordedUtc, string SourceCommitmentSha256, IReadOnlyDictionary<string, byte[]> Inputs);

public sealed record RecordedReplayWorkerOutput(IReadOnlyDictionary<string, JsonElement> Stages, JsonElement Final);

internal interface IRecordedReplayWorker
{
    Task<RecordedReplayWorkerOutput?> RunAsync(string imageId, RecordedReplayWorkerInput input, CancellationToken cancellationToken);
}

/// <summary>The first approved projection per product. Schema labels bind the exact wire shape, not just role names.</summary>
public static class RecordedReplayRecipe
{
    public const string Canonicalization = "json-structural-v1";
    public const string AuthorityOutput = "authority-agent-evidence-v1";
    public const string SecureNowOutput = "securenow-exposure-evidence-v1";
    public const string AgentStage = "accepted-agent";
    public const string AuthorityStage = "authority-evidence";
    public const string ToolStage = "recorded-evidence-tool";
    public const string ToolResult = "authority-external-evidence-refs-v1";
    public const string ToolProjection = "authority-external-evidence-projection-v1";
    public const string SecureNowStage = "exposure-evidence";
    public const string ImageSchema = "local-oci-image-id-v1";
    public const string RuntimeSchema = "local-oci-runtime-id-v1";
    public const string AuthorityEvidence = "authority-evidence-refs-v1";
    public const string AuthorityPolicy = "authority-agent-schema-policy-v1";
    public const string AuthorityConfiguration = "authority-agent-config-v1";
    public const string AgentTyped = "agent-result-typed-v1";
    public const string AgentProjection = "agent-result-evidence-projection-v1";
    public const string AgentRaw = "agent-result-raw-v1";
    public const string SecureNowEvidence = "securenow-inventory-snapshot-v1";
    public const string SecureNowPolicy = "securenow-exposure-policy-v1";
    public const string SecureNowConfiguration = "securenow-target-config-v1";
    internal const int MaxPlanCaptureBytes = 12 * 1024 * 1024;
    internal const int MaxWorkerInputBytes = 18 * 1024 * 1024;
    internal const int MaxWorkerOutputBytes = 512 * 1024;

    internal sealed record Binding(string Name, HistoricalArtifactRole Role, string Schema, string? Stage = null);

    internal static Binding[] Bindings(HistoricalReplayProduct product, HistoricalReplayMode mode, bool hasRecordedTool = false) =>
        product == HistoricalReplayProduct.ArchLucid
            ?
            [
                new("evidence", HistoricalArtifactRole.SourceEvidence, AuthorityEvidence),
                new("policy", HistoricalArtifactRole.EffectivePolicy, AuthorityPolicy),
                new("configuration", HistoricalArtifactRole.Configuration, AuthorityConfiguration),
                new("typed", HistoricalArtifactRole.AcceptedTypedInput, AgentTyped, AgentStage),
                ..(mode == HistoricalReplayMode.RecordedRaw
                    ? new[] { new Binding("raw", HistoricalArtifactRole.AcceptedRawResponse, AgentRaw, AgentStage) } : []),
                ..(hasRecordedTool
                    ? new[] { new Binding("tool", HistoricalArtifactRole.ExternalToolResult, ToolResult, ToolStage),
                        new Binding("stage:" + ToolStage, HistoricalArtifactRole.StageOutput, ToolProjection, ToolStage) } : []),
                new("stage:" + AgentStage, HistoricalArtifactRole.StageOutput, AgentProjection, AgentStage),
                new("stage:" + AuthorityStage, HistoricalArtifactRole.StageOutput, AuthorityOutput, AuthorityStage),
                new("expected", HistoricalArtifactRole.OriginalOutput, AuthorityOutput),
                new("image", HistoricalArtifactRole.Executable, ImageSchema),
                new("runtime", HistoricalArtifactRole.RuntimeDependencies, RuntimeSchema),
            ]
            :
            [
                new("evidence", HistoricalArtifactRole.SourceEvidence, SecureNowEvidence),
                new("policy", HistoricalArtifactRole.EffectivePolicy, SecureNowPolicy),
                new("configuration", HistoricalArtifactRole.Configuration, SecureNowConfiguration),
                new("stage:" + SecureNowStage, HistoricalArtifactRole.StageOutput, SecureNowOutput, SecureNowStage),
                new("expected", HistoricalArtifactRole.OriginalOutput, SecureNowOutput),
                new("image", HistoricalArtifactRole.Executable, ImageSchema),
                new("runtime", HistoricalArtifactRole.RuntimeDependencies, RuntimeSchema),
            ];

    internal static bool Accepts(HistoricalReplayDescriptor descriptor, HistoricalReplayMode mode)
    {
        var stages = descriptor.Stages;
        var hasRecordedTool = stages.Any(stage => stage.StageId == ToolStage);
        return descriptor.Versions?.CanonicalizationVersion == Canonicalization
            && (descriptor.Source.Run.Product == HistoricalReplayProduct.ArchLucid
                ? mode is HistoricalReplayMode.RecordedTyped or HistoricalReplayMode.RecordedRaw
                    && descriptor.Versions.OutputSchema == AuthorityOutput && stages.Count == (hasRecordedTool ? 3 : 2)
                    && (!hasRecordedTool || stages.Any(s => s.StageId == ToolStage && s.Kind == HistoricalStageKind.ExternalTool
                        && s.Dependencies.Count == 0))
                    && stages.Any(s => s.StageId == AgentStage && s.Kind == HistoricalStageKind.Model && s.Dependencies.Count == 0)
                    && stages.Any(s => s.StageId == AuthorityStage && s.Kind == HistoricalStageKind.Deterministic
                        && s.Dependencies.SequenceEqual(hasRecordedTool ? [AgentStage, ToolStage] : [AgentStage]))
                : mode == HistoricalReplayMode.RecordedTyped && descriptor.Versions.OutputSchema == SecureNowOutput
                    && stages.Count == 1 && stages[0].StageId == SecureNowStage
                    && stages[0].Kind == HistoricalStageKind.Deterministic && stages[0].Dependencies.Count == 0);
    }
}
