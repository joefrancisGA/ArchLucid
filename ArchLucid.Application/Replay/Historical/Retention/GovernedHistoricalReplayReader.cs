using System.Buffers;
using System.Security.Cryptography;
using System.Text.Json;

using ArchLucid.Core.Audit;
using ArchLucid.Core.Tenancy;

using Microsoft.Extensions.Logging;

using static ArchLucid.Application.Replay.Historical.HistoricalReplayDescriptorValidation;
using static ArchLucid.Application.Replay.Historical.Retention.HistoricalRetentionPolicyRules;

namespace ArchLucid.Application.Replay.Historical.Retention;

/// <summary>Opt-in scoped reader. Restoration supplies verified bytes to this one request, not a storage or history rewrite.</summary>
public sealed class GovernedHistoricalReplayReader : IScopedHistoricalArtifactReader
{
    private readonly HistoricalReplayTrust trust;
    private readonly HistoricalReplayDescriptor descriptor;
    private readonly HistoricalRetentionGrant grant;
    private readonly HistoricalRetentionPolicy policy;
    private readonly string policyHash;
    private readonly ITenantDirectoryReader tenants;
    private readonly IHistoricalRetentionAuthority authority;
    private readonly HistoricalErasureJournal erasure;
    private readonly IAuditService audit;
    private readonly HistoricalReplayStore primary;
    private readonly HistoricalReplayStore? archive;
    private readonly TimeProvider time;
    private readonly ILogger<GovernedHistoricalReplayReader> logger;
    private readonly Dictionary<string, HistoricalArtifactPin> pins;
    private readonly Dictionary<HistoricalArtifactRole, HistoricalRetentionRule> rules;

    public GovernedHistoricalReplayReader(HistoricalReplayTrust trust, HistoricalReplayDescriptor descriptor,
        HistoricalRetentionPolicy policy, string approvedPolicySha256, HistoricalRetentionGrant grant,
        ITenantDirectoryReader tenants, IHistoricalRetentionAuthority authority, HistoricalErasureJournal erasure,
        IAuditService audit, HistoricalReplayStore primary, HistoricalReplayStore? archive, TimeProvider time,
        ILogger<GovernedHistoricalReplayReader> logger)
    {
        ArgumentNullException.ThrowIfNull(trust);
        ArgumentNullException.ThrowIfNull(descriptor);
        ArgumentNullException.ThrowIfNull(policy);
        ArgumentNullException.ThrowIfNull(grant);
        ArgumentNullException.ThrowIfNull(primary);

        if (descriptor.Version != HistoricalReplayCompletenessService.DescriptorVersion
            || HistoricalReplayDescriptorValidation.Freeze(descriptor) is not { } sealedDescriptor || !ValidAnchor(trust.Source)
            || !EqualAnchors(sealedDescriptor.Source, trust.Source) || !SameHash(Digest(sealedDescriptor), trust.DescriptorSha256)
            || HistoricalRetentionPolicyRules.Freeze(policy) is not { } approved || approved.Scope != sealedDescriptor.Source.Run.Scope
            || !SameHash(DigestPolicy(approved), approvedPolicySha256) || grant.Run != sealedDescriptor.Source.Run
            || grant.GrantId == Guid.Empty || !Token(grant.ActorId) || !Enum.IsDefined(grant.Mode)
            || !Token(primary.StoreId) || primary.Reader is null
            || (archive is not null && (!Token(archive.StoreId) || archive.Reader is null || archive.StoreId == primary.StoreId)))
            throw new ArgumentException("The independently approved replay scope, descriptor, policy, grant or storage binding did not match.");

        this.trust = trust;
        this.descriptor = sealedDescriptor;
        this.policy = approved;
        policyHash = DigestPolicy(approved);
        this.grant = grant;
        this.tenants = tenants ?? throw new ArgumentNullException(nameof(tenants));
        this.authority = authority ?? throw new ArgumentNullException(nameof(authority));
        this.erasure = erasure ?? throw new ArgumentNullException(nameof(erasure));
        this.audit = audit ?? throw new ArgumentNullException(nameof(audit));
        this.primary = primary;
        this.archive = archive;
        this.time = time ?? throw new ArgumentNullException(nameof(time));
        this.logger = logger ?? throw new ArgumentNullException(nameof(logger));
        pins = sealedDescriptor.Artifacts.ToDictionary(row => row.ArtifactId, StringComparer.Ordinal);
        rules = approved.Rules.Where(row => row.Mode == grant.Mode).ToDictionary(row => row.Role);
    }

    public Task<HistoricalReplayAssessment> AssessAsync(HistoricalExecutionVersions? compatibleRuntime = null,
        CancellationToken cancellationToken = default) =>
        new HistoricalReplayCompletenessService(this).AssessAsync(trust, descriptor, grant.Mode, compatibleRuntime, cancellationToken);

    public async ValueTask<HistoricalArtifactRead?> OpenReadAsync(HistoricalArtifactIdentity identity, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(identity);
        cancellationToken.ThrowIfCancellationRequested();
        if (identity.Run != grant.Run || !pins.TryGetValue(identity.ArtifactId, out var pin)
            || identity != new HistoricalArtifactIdentity(grant.Run, pin.ArtifactId, pin.Role, pin.Schema, pin.StageId, pin.AttemptId)
            || !rules.TryGetValue(identity.Role, out var rule) || (IsRaw(identity.Role) && !rule.AllowExactRaw))
            return Unavailable(identity, HistoricalArtifactAvailability.AccessDenied);
        // A committed non-exact version cannot be upgraded by another archived representation.
        if (pin.RecordedAvailability != HistoricalArtifactAvailability.Exact)
            return Unavailable(identity, pin.RecordedAvailability);

        var first = await AuthorizeAsync(identity, pin, rule, cancellationToken);
        if (first.Decision is not { } decision)
            return Unavailable(identity, first.Status);

        if (!TrustedStorage(primary, decision.Primary))
            return Unavailable(identity, HistoricalArtifactAvailability.AccessDenied);
        var staged = await StageAsync(primary, identity, pin, cancellationToken);
        bool restored = false;
        if (staged.Availability == HistoricalArtifactAvailability.Missing && rule.AllowArchiveRestore && archive is { } fallback)
        {
            // An authorized selection is necessary again before contacting a recovery location.
            var beforeRestore = await AuthorizeAsync(identity, pin, rule, cancellationToken);
            if (beforeRestore.Decision != decision)
                return Unavailable(identity, Changed(beforeRestore));
            if (!TrustedStorage(fallback, decision.Archive))
                return Unavailable(identity, HistoricalArtifactAvailability.AccessDenied);
            staged = await StageAsync(fallback, identity, pin, cancellationToken);
            restored = true;
        }

        Stream? owned = staged.Content;
        if (owned is null)
            return staged;

        try
        {
            var checkedAgain = await AuthorizeAsync(identity, pin, rule, cancellationToken);
            if (checkedAgain.Decision != decision)
                return Unavailable(identity, Changed(checkedAgain));

            var scope = identity.Run.Scope;
            var verifiedForUse = new AuditEvent
            {
                EventType = AuditEventTypes.HistoricalReplayArtifactVerifiedForUse,
                OccurredUtc = time.GetUtcNow().UtcDateTime,
                TenantId = scope.TenantId, WorkspaceId = scope.WorkspaceId, ProjectId = scope.ProjectId,
                ActorUserId = grant.ActorId, ActorUserName = grant.ActorId, ExplicitActor = true,
                CorrelationId = HistoricalErasureJournal.Key(identity),
                DataJson = JsonSerializer.Serialize(new { grantId = grant.GrantId, mode = grant.Mode.ToString(),
                    policy.ApprovalId, policy.Revision, source = restored ? "archive" : "primary", bytes = pin.Length }),
            };
            await DurableAuditLogRetry.LogOrThrowAsync(ct => audit.LogAsync(verifiedForUse, ct), logger,
                "historical replay artifact verification", cancellationToken, maxAttempts: 1,
                auditEventTypeForMetrics: AuditEventTypes.HistoricalReplayArtifactVerifiedForUse);

            var afterAudit = await AuthorizeAsync(identity, pin, rule, cancellationToken);
            if (afterAudit.Decision != decision)
                return Unavailable(identity, Changed(afterAudit));
            cancellationToken.ThrowIfCancellationRequested();
            owned = null;
            return staged;
        }
        finally
        {
            if (owned is not null)
                await owned.DisposeAsync();
        }
    }

    private async ValueTask<Authorization> AuthorizeAsync(HistoricalArtifactIdentity identity, HistoricalArtifactPin pin,
        HistoricalRetentionRule rule, CancellationToken ct)
    {
        var now = time.GetUtcNow();
        if (now < policy.ApprovedUtc || now >= policy.AuthorizationEndsUtc || now >= grant.EndsUtc)
            return new(HistoricalArtifactAvailability.AccessDenied, null);

        var tenant = await tenants.GetByIdUncachedAsync(identity.Run.TenantId, ct);
        if (tenant is null || tenant.Id != identity.Run.TenantId || tenant.SuspendedUtc is not null
            || TenantErasureEligibility.IsTenantLoginBlocked(tenant, now) || !Token(tenant.DataRegion)
            || (tenant.DataRegion != TenantDataRegions.Default && tenant.DataRegion != policy.Region))
            return new(HistoricalArtifactAvailability.AccessDenied, null);

        var current = await authority.ReadCurrentAsync(grant, identity, ct);
        now = time.GetUtcNow();
        ct.ThrowIfCancellationRequested();
        if (current is null || current.Identity != identity || current.GrantId != grant.GrantId || current.ActorId != grant.ActorId
            || current.Mode != grant.Mode || current.GrantEndsUtc != grant.EndsUtc || !current.Authorized
            || !SameHash(current.PolicySha256, policyHash) || current.Revision < 1 || now >= current.GrantEndsUtc
            || now < policy.ApprovedUtc || now >= policy.AuthorizationEndsUtc || TenantErasureEligibility.IsTenantLoginBlocked(tenant, now))
            return new(HistoricalArtifactAvailability.AccessDenied, null);

        if (current.Lifecycle == HistoricalArtifactLifecycle.Erased)
            return new(HistoricalArtifactAvailability.Erased, null);
        if (current.Lifecycle == HistoricalArtifactLifecycle.ErasureApproved)
            return new(HistoricalArtifactAvailability.AccessDenied, null);
        if (current.Lifecycle != HistoricalArtifactLifecycle.Available || !current.ErasureIndexCoversAllCopies || !current.Durable)
            return new(HistoricalArtifactAvailability.Unknown, null);
        if (await erasure.IsErasedAsync(identity, ct))
            return new(HistoricalArtifactAvailability.Erased, null);

        now = time.GetUtcNow();
        if (now >= policy.AuthorizationEndsUtc || now >= grant.EndsUtc)
            return new(HistoricalArtifactAvailability.AccessDenied, null);
        if (pin.CapturedUtc is not { } capture || capture > now || current.HardExpiresUtc < capture)
            return new(HistoricalArtifactAvailability.Unknown, null);
        // A hold can prevent deletion, but cannot extend read authorization or reset age on restore.
        if (now >= current.HardExpiresUtc || now - capture >= TimeSpan.FromDays(rule.MaximumAgeDays))
            return new(HistoricalArtifactAvailability.Expired, null);
        if (!Enum.IsDefined(current.Fidelity) || current.Fidelity == HistoricalArtifactAvailability.NotChecked)
            return new(HistoricalArtifactAvailability.Unknown, null);
        return current.Fidelity == HistoricalArtifactAvailability.Exact
            ? new(HistoricalArtifactAvailability.Exact, current) : new(current.Fidelity, null);
    }

    private bool TrustedStorage(HistoricalReplayStore store, HistoricalStorageWitness? witness) =>
        witness is { EncryptedAtRest: true, RestrictedToHistoricalReplay: true }
        && witness.StoreId == store.StoreId && witness.Region == policy.Region;

    private static HistoricalArtifactAvailability Changed(Authorization authorization) => authorization.Decision is null
        ? authorization.Status : HistoricalArtifactAvailability.AccessDenied;

    private static HistoricalArtifactRead Unavailable(HistoricalArtifactIdentity identity, HistoricalArtifactAvailability status) =>
        new(identity, status, null);

    private static async Task<HistoricalArtifactRead> StageAsync(HistoricalReplayStore source, HistoricalArtifactIdentity expected,
        HistoricalArtifactPin pin, CancellationToken ct)
    {
        var candidate = await source.Reader.OpenReadAsync(expected, ct);
        if (candidate is null)
            return Unavailable(expected, HistoricalArtifactAvailability.Missing);

        await using var content = candidate.Content;
        if (candidate.Identity != expected)
            return Unavailable(expected, candidate.Identity is { } returned && (returned with { Schema = expected.Schema }) == expected
                ? HistoricalArtifactAvailability.Incompatible : HistoricalArtifactAvailability.AccessDenied);
        if (candidate.Availability != HistoricalArtifactAvailability.Exact)
            return Unavailable(expected, Enum.IsDefined(candidate.Availability) && candidate.Availability != HistoricalArtifactAvailability.NotChecked
                ? candidate.Availability : HistoricalArtifactAvailability.Unknown);
        if (content is null)
            return Unavailable(expected, HistoricalArtifactAvailability.Missing);
        if (!content.CanRead)
            return Unavailable(expected, HistoricalArtifactAvailability.Unknown);

        int length = checked((int)pin.Length!.Value);
        byte[]? buffer = ArrayPool<byte>.Shared.Rent(Math.Max(1, length));
        try
        {
            int offset = 0;
            while (offset < length)
            {
                int bytes = await content.ReadAsync(buffer.AsMemory(offset, length - offset), ct);
                if (bytes == 0)
                    break;
                offset += bytes;
            }
            ct.ThrowIfCancellationRequested();
            if (offset != length || await content.ReadAsync(new byte[1], ct) != 0 || !SameHash(Convert.ToHexString(SHA256.HashData(buffer.AsSpan(0, length))), pin.Sha256))
                return Unavailable(expected, HistoricalArtifactAvailability.Tampered);

            var verified = new OwnedReplayStream(buffer, length);
            buffer = null;
            return new(expected, HistoricalArtifactAvailability.Exact, verified);
        }
        finally
        {
            if (buffer is not null)
                ArrayPool<byte>.Shared.Return(buffer, clearArray: true);
        }
    }

    private sealed record Authorization(HistoricalArtifactAvailability Status, HistoricalRetentionDecision? Decision);

    // Do not expose a MemoryStream subclass: its ToArray may inspect the backing array even after disposal.
    private sealed class OwnedReplayStream(byte[] data, int length) : Stream
    {
        private readonly MemoryStream inner = new(data, 0, length, writable: false, publiclyVisible: false);
        private byte[]? owned = data;

        public override bool CanRead => inner.CanRead;
        public override bool CanSeek => inner.CanSeek;
        public override bool CanWrite => false;
        public override long Length => inner.Length;
        public override long Position { get => inner.Position; set => inner.Position = value; }
        public override void Flush() => inner.Flush();
        public override int Read(byte[] buffer, int offset, int count) => inner.Read(buffer, offset, count);
        public override int Read(Span<byte> buffer) => inner.Read(buffer);
        public override ValueTask<int> ReadAsync(Memory<byte> buffer, CancellationToken cancellationToken = default) =>
            inner.ReadAsync(buffer, cancellationToken);
        public override long Seek(long offset, SeekOrigin origin) => inner.Seek(offset, origin);
        public override void SetLength(long value) => throw new NotSupportedException();
        public override void Write(byte[] buffer, int offset, int count) => throw new NotSupportedException();

        protected override void Dispose(bool disposing)
        {
            if (disposing)
            {
                inner.Dispose();
                var previous = Interlocked.Exchange(ref owned, null);
                if (previous is not null)
                    ArrayPool<byte>.Shared.Return(previous, clearArray: true);
            }
            base.Dispose(disposing);
        }
    }
}
