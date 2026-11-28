using System.Security.Cryptography;
using System.Text.Json;

using ArchLucid.Application.Replay.Historical.Execution;
using ArchLucid.Application.Replay.Historical.Retention;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Audit;

using Microsoft.Extensions.Logging;

using static ArchLucid.Application.Replay.Historical.HistoricalReplayDescriptorValidation;

namespace ArchLucid.Application.Replay.Historical.Assurance;

public enum HistoricalClaimVerdict { Indeterminate, Supported, Refuted }

public sealed record HistoricalClaimReview(HistoricalClaimVerdict Verdict, string Reason, string? Rule,
    int ClaimIndex, IReadOnlyList<string> VerifiedArtifactIds);

public sealed record HistoricalReplayDrift(string? FirstDifference, IReadOnlyList<string> DependentStages, bool FinalDiffers);

public sealed record HistoricalReplayAssuranceReport(Guid? AuditId, string Reason, HistoricalReplayAssessment? Reconstruction,
    RecordedReplayResult? Reproduction, HistoricalClaimReview? IndependentReview, HistoricalReplayDrift? Drift);

public sealed record HistoricalAssuranceReplay(HistoricalRetentionGrant Grant, GovernedHistoricalReplayReader Artifacts);

/// <summary>Independent execution and reporting permission, not implied by artifact custody or replay permission.</summary>
public interface IHistoricalAssuranceAuthority
{
    ValueTask<bool> IsAuthorizedAsync(HistoricalRetentionGrant grant, string descriptorSha256, int claimIndex,
        CancellationToken cancellationToken);
}

/// <summary>Opt-in read-only assurance. Reproduction does not supply any input to independent claim evaluation.</summary>
public sealed class HistoricalReplayAssurance(IHistoricalAssuranceAuthority authority, IScopeContextProvider scopes,
    RecordedHistoricalReplay recordedReplay, IAuditService audit, TimeProvider clock, ILogger<HistoricalReplayAssurance> logger)
{
    private readonly IHistoricalAssuranceAuthority authority = authority ?? throw new ArgumentNullException(nameof(authority));
    private readonly IScopeContextProvider scopes = scopes ?? throw new ArgumentNullException(nameof(scopes));
    private readonly RecordedHistoricalReplay recordedReplay = recordedReplay ?? throw new ArgumentNullException(nameof(recordedReplay));
    private readonly IAuditService audit = audit ?? throw new ArgumentNullException(nameof(audit));
    private readonly TimeProvider clock = clock ?? throw new ArgumentNullException(nameof(clock));
    private readonly ILogger<HistoricalReplayAssurance> logger = logger ?? throw new ArgumentNullException(nameof(logger));

    public async Task<HistoricalReplayAssuranceReport> AssessAsync(HistoricalReplayTrust trust, HistoricalReplayDescriptor raw,
        HistoricalRetentionGrant grant, GovernedHistoricalReplayReader artifacts, int claimIndex,
        HistoricalAssuranceReplay? reproduction = null, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(trust);
        ArgumentNullException.ThrowIfNull(grant);
        ArgumentNullException.ThrowIfNull(artifacts);
        var ct = cancellationToken;
        ct.ThrowIfCancellationRequested();
        if (raw is null || raw.Version != HistoricalReplayCompletenessService.DescriptorVersion
            || Freeze(raw) is not { } descriptor || !ValidAnchor(trust.Source) || !EqualAnchors(descriptor.Source, trust.Source)
            || !IsHash(trust.DescriptorSha256) || !SameHash(trust.DescriptorSha256, Digest(descriptor))
            || grant.Run != descriptor.Source.Run || grant.Mode != HistoricalReplayMode.Reconstruction || grant.GrantId == Guid.Empty
            || !HistoricalRetentionPolicyRules.Token(grant.ActorId) || claimIndex is < 0 or > 255
            || !artifacts.IsBoundTo(trust, grant))
            return Rejected("invalid_assurance_scope_or_descriptor");

        if (reproduction is not null && (reproduction.Grant is not { } replayGrant || reproduction.Artifacts is null
            || replayGrant.Run != grant.Run || replayGrant.ActorId != grant.ActorId
            || replayGrant.Mode is not (HistoricalReplayMode.RecordedTyped or HistoricalReplayMode.RecordedRaw)
            || !reproduction.Artifacts.IsBoundTo(trust, replayGrant)))
            return Rejected("invalid_optional_reproduction_scope");

        var commitment = trust.DescriptorSha256!;
        async Task<bool> AuthorizedAsync()
        {
            ct.ThrowIfCancellationRequested();
            var current = scopes.GetCurrentScope();
            if (!grant.Run.Scope.Matches(current.TenantId, current.WorkspaceId, current.ProjectId) || clock.GetUtcNow() >= grant.EndsUtc)
                return false;
            var allowed = await authority.IsAuthorizedAsync(grant, commitment, claimIndex, ct);
            ct.ThrowIfCancellationRequested();
            return allowed && clock.GetUtcNow() < grant.EndsUtc;
        }
        if (!await AuthorizedAsync())
            return Rejected("independent_review_not_authorized");

        var session = new AssuranceReader(artifacts);
        async Task<bool> RecheckAsync() => await AuthorizedAsync() && await session.RecheckAsync(ct) && await AuthorizedAsync();

        var reconstruction = await new HistoricalReplayCompletenessService(session).AssessAsync(trust, descriptor,
            HistoricalReplayMode.Reconstruction, cancellationToken: ct);
        if (reconstruction.Status == HistoricalReplayReadiness.Rejected || !await RecheckAsync())
            return Rejected("reconstruction_binding_or_access_changed");

        HistoricalClaimReview review;
        using (var evidence = new HistoricalClaimInputs(descriptor, session, ct))
            review = await HistoricalClaimOracle.EvaluateAsync(descriptor, evidence, claimIndex, ct);
        if (!await RecheckAsync())
            return Rejected("claim_evidence_access_changed");

        RecordedReplayResult? replay = reproduction is null ? null
            : await recordedReplay.ReplayAsync(trust, descriptor, reproduction.Grant, reproduction.Artifacts, ct);
        var drift = DescribeDrift(descriptor, replay);
        if (!await RecheckAsync())
            return Rejected("assurance_access_changed_before_report");

        var id = Guid.NewGuid();
        var scope = grant.Run.Scope;
        var evt = new AuditEvent
        {
            EventType = AuditEventTypes.HistoricalIndependentAssuranceCompleted,
            OccurredUtc = clock.GetUtcNow().UtcDateTime, CorrelationId = id.ToString("D"),
            TenantId = scope.TenantId, WorkspaceId = scope.WorkspaceId, ProjectId = scope.ProjectId,
            ActorUserId = grant.ActorId, ActorUserName = grant.ActorId, ExplicitActor = true,
            DataJson = JsonSerializer.Serialize(new
            {
                descriptor.Source.SourceRecordId, grant.Run.RunId, grant.Run.SnapshotId, grant.Run.FindingId,
                product = grant.Run.Product.ToString(), descriptorSha256 = commitment, grant.GrantId,
                descriptor.Versions, reconstruction = reconstruction.Status.ToString(),
                reproduction = replay?.Outcome.ToString() ?? "NotRequested",
                reproductionMode = replay?.Mode.ToString(), reproductionAuditId = replay?.AuditId, reproductionReason = replay?.Reason,
                reconstructionGaps = reconstruction.Issues,
                independentReview = review.Verdict.ToString(), review.Reason, review.Rule, review.ClaimIndex,
                review.VerifiedArtifactIds, drift,
            }),
        };
        await DurableAuditLogRetry.LogOrThrowAsync(token => audit.LogAsync(evt, token), logger, "historical independent assurance",
            ct, maxAttempts: 1, auditEventTypeForMetrics: AuditEventTypes.HistoricalIndependentAssuranceCompleted);
        if (!await RecheckAsync())
            return Rejected("assurance_access_changed_after_audit");
        // A report exposes only the recorded replay receipt/status and comparisons, never a second copy of its input inventory.
        return new(id, "historical_assurance_only", reconstruction, replay is null ? null : replay with { Assessment = null }, review, drift);
    }

    private static HistoricalReplayAssuranceReport Rejected(string reason) => new(null, reason, null, null, null, null);

    internal static HistoricalReplayDrift? DescribeDrift(HistoricalReplayDescriptor descriptor, RecordedReplayResult? replay)
    {
        if (replay is not { Outcome: RecordedReplayOutcome.DriftDetected, Comparisons: { } comparisons })
            return null;
        var changed = comparisons.Where(item => !item.Matches).Select(item => item.Subject).ToHashSet(StringComparer.Ordinal);
        HashSet<string> visited = new(StringComparer.Ordinal);
        HashSet<string> affected = new(StringComparer.Ordinal);
        List<string> orderedDependents = [];
        string? first = null;
        while (visited.Count < descriptor.Stages.Count)
        {
            var available = descriptor.Stages.Where(stage => !visited.Contains(stage.StageId)
                    && stage.Dependencies.All(visited.Contains))
                .OrderBy(stage => stage.StageId, StringComparer.Ordinal).ToArray();
            if (available.Length == 0)
                break;
            foreach (var stage in available)
            {
                visited.Add(stage.StageId);
                if (stage.Dependencies.Any(affected.Contains))
                {
                    affected.Add(stage.StageId);
                    orderedDependents.Add(stage.StageId);
                }
                if (changed.Contains(stage.StageId))
                {
                    first ??= stage.StageId;
                    affected.Add(stage.StageId);
                }
            }
        }
        var final = changed.Contains("final");
        return new(first ?? (final ? "final" : null), FreezeRows(orderedDependents), final);
    }

    private sealed class AssuranceReader(GovernedHistoricalReplayReader reader) : IScopedHistoricalArtifactReader
    {
        private readonly Dictionary<HistoricalArtifactIdentity, HistoricalRetentionDecision> receipts = [];
        private bool consistent = true;

        public ValueTask<HistoricalArtifactRead?> OpenReadAsync(HistoricalArtifactIdentity identity, CancellationToken cancellationToken) =>
            reader.OpenWithReceiptAsync(identity, receipt =>
            {
                if (!receipts.TryAdd(identity, receipt) && receipts[identity] != receipt)
                    consistent = false;
            }, cancellationToken);

        internal async Task<bool> RecheckAsync(CancellationToken ct)
        {
            if (!consistent)
                return false;
            foreach (var (identity, receipt) in receipts)
                if (!(await reader.RemainsAuthorizedAsync(identity, receipt, ct)))
                    return false;
            return true;
        }
    }
}

/// <summary>Exact bounded governed reads for only the oracle's designated recorded inputs. Never reads raw prompts or model responses.</summary>
internal sealed class HistoricalClaimInputs(HistoricalReplayDescriptor descriptor, IScopedHistoricalArtifactReader reader, CancellationToken ct) : IDisposable
{
    private const long Limit = 8 * 1024 * 1024;
    private readonly List<byte[]> allocated = [];
    private readonly List<string> verified = [];
    private long total;
    internal IReadOnlyList<string> Verified => FreezeRows(verified);

    internal async Task<byte[]?> GetAsync(HistoricalArtifactRole role, string schema, string? stage = null)
    {
        ct.ThrowIfCancellationRequested();
        var matches = descriptor.Artifacts.Where(pin => pin.Role == role && pin.StageId == stage).ToArray();
        if (matches is not [var pin] || pin.Schema != schema || pin.RecordedAvailability != HistoricalArtifactAvailability.Exact
            || pin.Length is not long length || length > Limit - total)
            return null;
        total += length;

        var id = new HistoricalArtifactIdentity(descriptor.Source.Run, pin.ArtifactId, role, schema, stage, pin.AttemptId);
        try
        {
            var read = await reader.OpenReadAsync(id, ct);
            await using var content = read?.Content;
            if (read is not { Availability: HistoricalArtifactAvailability.Exact } || read.Identity != id || content is null || !content.CanRead)
                return null;
            var bytes = new byte[(int)length];
            allocated.Add(bytes);
            if (await content.ReadAtLeastAsync(bytes, bytes.Length, false, ct) != bytes.Length
                || await content.ReadAsync(new byte[1], ct) != 0
                || !SameHash(Convert.ToHexString(SHA256.HashData(bytes)), pin.Sha256))
                return null;
            verified.Add(pin.ArtifactId);
            return bytes;
        }
        catch (Exception e) when (e is IOException or UnauthorizedAccessException)
        {
            return null;
        }
    }

    public void Dispose()
    {
        foreach (var bytes in allocated)
            CryptographicOperations.ZeroMemory(bytes);
    }
}
