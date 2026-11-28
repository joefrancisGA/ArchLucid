using System.Security.Cryptography;
using System.Text;
using System.Text.Json;

using ArchLucid.Application.Replay.Historical.Retention;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Audit;

using Microsoft.Extensions.Logging;

using static ArchLucid.Application.Replay.Historical.HistoricalReplayDescriptorValidation;
using static ArchLucid.Application.Replay.Historical.Execution.RecordedReplayRecipe;

namespace ArchLucid.Application.Replay.Historical.Execution;

/// <summary>Fresh scoped execution and report authorization, independent of any artifact read grant.</summary>
public interface IRecordedReplayAuthority
{
    ValueTask<bool> IsAuthorizedAsync(HistoricalRetentionGrant grant, string descriptorSha256, CancellationToken cancellationToken);
}

/// <summary>Opt-in historical replay. Never runs legacy rebuild or exposes artifact bytes in a report.</summary>
public sealed class RecordedHistoricalReplay
{
    private readonly IRecordedReplayAuthority authority;
    private readonly IScopeContextProvider scopes;
    private readonly IAuditService audit;
    private readonly TimeProvider clock;
    private readonly ILogger<RecordedHistoricalReplay> logger;
    private readonly IRecordedReplayWorker worker;
    private readonly IReadOnlyList<RecordedReplayImage> approvals;

    public RecordedHistoricalReplay(IRecordedReplayAuthority authority, IScopeContextProvider scopes, IAuditService audit,
        TimeProvider clock, ILogger<RecordedHistoricalReplay> logger, IsolatedRecordedReplayWorker worker,
        IEnumerable<RecordedReplayImage> approvedImages)
        : this(authority, scopes, audit, clock, logger, (IRecordedReplayWorker)worker, approvedImages)
    {
    }

    internal RecordedHistoricalReplay(IRecordedReplayAuthority authority, IScopeContextProvider scopes, IAuditService audit,
        TimeProvider clock, ILogger<RecordedHistoricalReplay> logger, IRecordedReplayWorker worker,
        IEnumerable<RecordedReplayImage> approvedImages)
    {
        this.authority = authority ?? throw new ArgumentNullException(nameof(authority));
        this.scopes = scopes ?? throw new ArgumentNullException(nameof(scopes));
        this.audit = audit ?? throw new ArgumentNullException(nameof(audit));
        this.clock = clock ?? throw new ArgumentNullException(nameof(clock));
        this.logger = logger ?? throw new ArgumentNullException(nameof(logger));
        this.worker = worker ?? throw new ArgumentNullException(nameof(worker));
        approvals = FreezeRows(approvedImages ?? throw new ArgumentNullException(nameof(approvedImages)));
        if (approvals.Any(row => !IsolatedRecordedReplayWorker.IsImageId(row.ImageId)
                || !Enum.IsDefined(row.Product) || row.Mode is not (HistoricalReplayMode.RecordedTyped or HistoricalReplayMode.RecordedRaw))
            || approvals.GroupBy(row => (row.Product, row.Mode, row.Versions)).Any(group => group.Count() > 1))
            throw new ArgumentException("Invalid or ambiguous replay image approvals.", nameof(approvedImages));
    }

    public Task<RecordedReplayResult> ReplayAsync(HistoricalReplayTrust trust, HistoricalReplayDescriptor descriptor,
        HistoricalRetentionGrant grant, GovernedHistoricalReplayReader artifacts, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(trust);
        ArgumentNullException.ThrowIfNull(grant);
        ArgumentNullException.ThrowIfNull(artifacts);
        cancellationToken.ThrowIfCancellationRequested();
        if (!artifacts.IsBoundTo(trust, grant))
            return Task.FromResult(new RecordedReplayResult(RecordedReplayOutcome.Rejected, grant.Mode, "governed_reader_binding_mismatch"));
        var session = new GovernedReadSession(artifacts);
        return ReplayVerifiedAsync(trust, descriptor, grant, session, session.RecheckAsync, cancellationToken);
    }

    internal async Task<RecordedReplayResult> ReplayVerifiedAsync(HistoricalReplayTrust trust, HistoricalReplayDescriptor raw,
        HistoricalRetentionGrant grant, IScopedHistoricalArtifactReader artifacts,
        Func<HistoricalArtifactIdentity, CancellationToken, ValueTask<bool>> stillAuthorized, CancellationToken ct)
    {
        ct.ThrowIfCancellationRequested();
        var mode = grant.Mode;
        RecordedReplayResult Result(RecordedReplayOutcome outcome, string reason, HistoricalReplayAssessment? assessment = null) =>
            new(outcome, mode, reason, assessment);

        if (raw is null || raw.Version != HistoricalReplayCompletenessService.DescriptorVersion || Freeze(raw) is not { } descriptor
            || !ValidAnchor(trust.Source) || !EqualAnchors(descriptor.Source, trust.Source)
            || !IsHash(trust.DescriptorSha256) || !SameHash(Digest(descriptor), trust.DescriptorSha256)
            || grant.Run != descriptor.Source.Run || grant.GrantId == Guid.Empty || !HistoricalRetentionPolicyRules.Token(grant.ActorId)
            || mode is not (HistoricalReplayMode.RecordedTyped or HistoricalReplayMode.RecordedRaw))
            return Result(RecordedReplayOutcome.Rejected, "invalid_descriptor_run_grant_or_mode");

        var digest = trust.DescriptorSha256!;
        if (!await AuthorizedAsync(grant, digest, ct))
            return Result(RecordedReplayOutcome.Rejected, "replay_execution_not_authorized");

        var image = approvals.SingleOrDefault(row => row.Product == grant.Run.Product && row.Mode == mode
            && row.Versions == descriptor.Versions);
        if (image is null || !Accepts(descriptor, mode))
            return Result(RecordedReplayOutcome.Unavailable, "historical_recipe_or_image_not_approved");

        var bindings = Bindings(grant.Run.Product, mode, descriptor.Stages.Any(stage => stage.StageId == ToolStage));
        Dictionary<string, HistoricalArtifactPin> selected = new(StringComparer.Ordinal);
        foreach (var binding in bindings)
        {
            var matches = descriptor.Artifacts.Where(pin => pin.Role == binding.Role && pin.StageId == binding.Stage).ToArray();
            if (matches is not [var pin] || pin.Schema != binding.Schema)
                return Result(RecordedReplayOutcome.Unavailable, "recipe_binding_missing_ambiguous_or_incompatible_" + binding.Name);
            selected.Add(binding.Name, pin);
        }

        if (selected.Values.Sum(pin => pin.Length ?? 0) > MaxPlanCaptureBytes)
            return Result(RecordedReplayOutcome.Unavailable, "worker_input_budget_exceeded");

        using var capture = new ReplayCapture(artifacts, selected);
        var assessment = await new HistoricalReplayCompletenessService(capture).AssessAsync(trust, descriptor, mode, image.Versions, ct);
        if (!await AuthorizedAsync(grant, digest, ct))
            return Result(RecordedReplayOutcome.Rejected, "replay_access_changed_during_preflight");
        if (assessment.Status != HistoricalReplayReadiness.Ready)
            return Result(assessment.Status switch
            {
                HistoricalReplayReadiness.Rejected => RecordedReplayOutcome.Rejected,
                HistoricalReplayReadiness.Partial => RecordedReplayOutcome.Partial,
                _ => RecordedReplayOutcome.Unavailable,
            }, "historical_artifacts_not_ready", assessment);

        if (capture.Bytes.Count != selected.Count
            || !capture.Bytes["image"].AsSpan().SequenceEqual(Encoding.ASCII.GetBytes(image.ImageId))
            || !capture.Bytes["runtime"].AsSpan().SequenceEqual(Encoding.ASCII.GetBytes(image.ImageId)))
            return Result(RecordedReplayOutcome.Unavailable, "pinned_image_or_runtime_mismatch", assessment);

        var required = assessment.Artifacts.Where(row => row.Required).Select(row => row.ArtifactId).ToHashSet(StringComparer.Ordinal);
        HistoricalArtifactIdentity[] identities = descriptor.Artifacts.Where(pin => required.Contains(pin.ArtifactId))
            .Select(pin => new HistoricalArtifactIdentity(grant.Run, pin.ArtifactId, pin.Role, pin.Schema, pin.StageId, pin.AttemptId)).ToArray();

        async Task<bool> RecheckAsync()
        {
            if (!await AuthorizedAsync(grant, digest, ct))
                return false;
            foreach (var identity in identities)
                if (!await stillAuthorized(identity, ct))
                    return false;
            return await AuthorizedAsync(grant, digest, ct);
        }

        if (!await RecheckAsync())
            return Result(RecordedReplayOutcome.Rejected, "replay_access_changed_before_execution");

        var input = new RecordedReplayWorkerInput(grant.Run, mode, descriptor.RecordedUtc, descriptor.Source.CommitmentSha256,
            capture.Bytes.Where(row => row.Key is "evidence" or "policy" or "configuration" or "typed" or "raw" or "tool")
                .ToDictionary(StringComparer.Ordinal));
        var actual = await worker.RunAsync(image.ImageId, input, ct);
        if (!await RecheckAsync())
            return Result(RecordedReplayOutcome.Rejected, "replay_access_changed_during_execution");
        List<RecordedReplayComparison> comparisons = [];
        if (actual is null || actual.Stages is null || actual.Stages.Count != descriptor.Stages.Count
            || actual.Final.ValueKind != JsonValueKind.Object)
            return Result(RecordedReplayOutcome.Unavailable, "isolated_worker_or_output_unavailable", assessment);

        try
        {
            foreach (var stage in descriptor.Stages)
            {
                if (!actual.Stages.TryGetValue(stage.StageId, out var value) || value.ValueKind != JsonValueKind.Object)
                    return Result(RecordedReplayOutcome.Unavailable, "worker_stage_output_invalid", assessment);
                comparisons.Add(new(stage.StageId, Equivalent(capture.Bytes["stage:" + stage.StageId], value)));
            }
            comparisons.Add(new("final", Equivalent(capture.Bytes["expected"], actual.Final)));
        }
        catch (JsonException)
        {
            return Result(RecordedReplayOutcome.Unavailable, "semantic_output_invalid", assessment);
        }

        if (!await RecheckAsync())
            return Result(RecordedReplayOutcome.Rejected, "replay_access_changed_before_audit");

        var outcome = comparisons.All(row => row.Matches) ? RecordedReplayOutcome.ReproducedWithinScope : RecordedReplayOutcome.DriftDetected;
        var auditId = Guid.NewGuid();
        var scope = grant.Run.Scope;
        var evt = new AuditEvent
        {
            EventType = AuditEventTypes.HistoricalRecordedReplayCompleted,
            TenantId = scope.TenantId, WorkspaceId = scope.WorkspaceId, ProjectId = scope.ProjectId,
            ActorUserId = grant.ActorId, ActorUserName = grant.ActorId, ExplicitActor = true,
            OccurredUtc = clock.GetUtcNow().UtcDateTime, CorrelationId = auditId.ToString("D"),
            DataJson = JsonSerializer.Serialize(new { sourceRecordId = descriptor.Source.SourceRecordId, grant.Run.RunId,
                grant.Run.SnapshotId, grant.Run.FindingId, grant.GrantId, descriptorSha256 = digest, image.ImageId,
                image.Versions, product = grant.Run.Product.ToString(), mode = mode.ToString(), outcome = outcome.ToString(), comparisons }),
        };
        await DurableAuditLogRetry.LogOrThrowAsync(token => audit.LogAsync(evt, token), logger,
            "historical recorded replay completion", ct, maxAttempts: 1,
            auditEventTypeForMetrics: AuditEventTypes.HistoricalRecordedReplayCompleted);
        if (!await RecheckAsync())
            return Result(RecordedReplayOutcome.Rejected, "replay_access_changed_before_report");

        return new(outcome, mode, "recorded_input_projection_only", assessment, auditId, FreezeRows(comparisons));
    }

    private async ValueTask<bool> AuthorizedAsync(HistoricalRetentionGrant grant, string digest, CancellationToken ct)
    {
        ct.ThrowIfCancellationRequested();
        var current = scopes.GetCurrentScope();
        if (!grant.Run.Scope.Matches(current.TenantId, current.WorkspaceId, current.ProjectId) || clock.GetUtcNow() >= grant.EndsUtc)
            return false;
        var allowed = await authority.IsAuthorizedAsync(grant, digest, ct);
        ct.ThrowIfCancellationRequested();
        return allowed && clock.GetUtcNow() < grant.EndsUtc;
    }

    private static bool Equivalent(byte[] pinned, JsonElement actual)
    {
        using var document = JsonDocument.Parse(pinned, new JsonDocumentOptions { MaxDepth = 32 });
        if (document.RootElement.ValueKind != JsonValueKind.Object || !IsUnambiguous(document.RootElement) || !IsUnambiguous(actual))
            throw new JsonException("An output did not match the structural JSON contract.");
        return JsonElement.DeepEquals(document.RootElement, actual);
    }

    private static bool IsUnambiguous(JsonElement item) => item.ValueKind switch
    {
        JsonValueKind.Object => item.EnumerateObject().Select(property => property.Name).Distinct(StringComparer.Ordinal).Count()
            == item.EnumerateObject().Count() && item.EnumerateObject().All(property => IsUnambiguous(property.Value)),
        JsonValueKind.Array => item.EnumerateArray().All(IsUnambiguous),
        _ => true,
    };

    private sealed class GovernedReadSession(GovernedHistoricalReplayReader reader) : IScopedHistoricalArtifactReader
    {
        private readonly Dictionary<HistoricalArtifactIdentity, HistoricalRetentionDecision> receipts = [];

        public ValueTask<HistoricalArtifactRead?> OpenReadAsync(HistoricalArtifactIdentity identity, CancellationToken cancellationToken) =>
            reader.OpenWithReceiptAsync(identity, receipt => receipts.Add(identity, receipt), cancellationToken);

        public ValueTask<bool> RecheckAsync(HistoricalArtifactIdentity identity, CancellationToken ct) =>
            receipts.TryGetValue(identity, out var receipt) ? reader.RemainsAuthorizedAsync(identity, receipt, ct) : ValueTask.FromResult(false);
    }

    // Keep only inputs and expected projections for this recipe. The existing completeness checker verifies the very
    // same staged bytes before they can be executed; no verification/read split against mutable backing storage.
    private sealed class ReplayCapture(IScopedHistoricalArtifactReader upstream, Dictionary<string, HistoricalArtifactPin> selected)
        : IScopedHistoricalArtifactReader, IDisposable
    {
        private readonly Dictionary<string, (string Name, long? Length)> byId =
            selected.ToDictionary(row => row.Value.ArtifactId, row => (row.Key, row.Value.Length), StringComparer.Ordinal);
        public Dictionary<string, byte[]> Bytes { get; } = new(StringComparer.Ordinal);

        public async ValueTask<HistoricalArtifactRead?> OpenReadAsync(HistoricalArtifactIdentity identity, CancellationToken cancellationToken)
        {
            var result = await upstream.OpenReadAsync(identity, cancellationToken);
            if (!byId.TryGetValue(identity.ArtifactId, out var binding) || result is not { Availability: HistoricalArtifactAvailability.Exact,
                    Content: { CanRead: true } stream } || result.Identity != identity || binding.Length is not long size)
                return result;

            await using var owned = stream;
            byte[] bytes = new byte[(int)size];
            try
            {
                if (await stream.ReadAtLeastAsync(bytes, bytes.Length, false, cancellationToken) != bytes.Length
                    || await stream.ReadAsync(new byte[1], cancellationToken) != 0)
                    return result with { Availability = HistoricalArtifactAvailability.Tampered, Content = null };
                Bytes.Add(binding.Name, bytes);
                return result with { Content = new MemoryStream(bytes, writable: false) };
            }
            finally
            {
                if (!Bytes.ContainsKey(binding.Name))
                    CryptographicOperations.ZeroMemory(bytes);
            }
        }

        public void Dispose()
        {
            foreach (var bytes in Bytes.Values)
                CryptographicOperations.ZeroMemory(bytes);
            Bytes.Clear();
        }
    }
}
