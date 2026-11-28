using System.Data;
using System.Diagnostics;
using System.Globalization;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;

using ArchLucid.Application.Replay.Historical;
using ArchLucid.Application.Replay.Historical.Retention;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Llm.Redaction;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Audit;
using ArchLucid.Persistence.BlobStore;

using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Time.Testing;

using Moq;

namespace ArchLucid.Application.Tests.Replay;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class HistoricalReplayRetentionTests
{
    private const string Hash = "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";

    [Fact]
    public async Task Authorized_archive_restore_recovers_the_exact_bytes_from_the_existing_encrypted_file_fixture()
    {
        var f = new Fixture();
        string root = Path.Combine(Path.GetTempPath(), "fnd096-" + Guid.NewGuid().ToString("N"));
        Directory.CreateDirectory(root);
        try
        {
            var tenantScope = new ScopeContext { TenantId = f.Run.TenantId, WorkspaceId = f.Run.WorkspaceId, ProjectId = f.Run.ProjectId };
            var scope = new Mock<IScopeContextProvider>(MockBehavior.Strict);
            scope.Setup(provider => provider.GetCurrentScope()).Returns(tenantScope);
            IArtifactBlobStore store = new LocalFileArtifactBlobStore(root, scope.Object);
            byte[] key = RandomNumberGenerator.GetBytes(32);
            byte[] nonce = RandomNumberGenerator.GetBytes(12);
            byte[] tag = new byte[16];
            byte[] plain = Fixture.Bytes("archived-output");
            byte[] encrypted = new byte[plain.Length];
            using var cipher = new AesGcm(key, tag.Length);
            cipher.Encrypt(nonce, plain, encrypted, tag);
            string uri = await store.WriteAsync("historical", "verified-envelope",
                Convert.ToBase64String([.. nonce, .. tag, .. encrypted]), CancellationToken.None);
            var stored = new FileInfo(new Uri(uri).LocalPath);
            Assert.DoesNotContain(Encoding.UTF8.GetString(plain), await File.ReadAllTextAsync(stored.FullName, CancellationToken.None),
                StringComparison.Ordinal);
            int archiveReads = 0;
            f.Primary.Lookup = (_, _) => ValueTask.FromResult<HistoricalArtifactRead?>(null);
            f.Archive.Lookup = async (identity, ct) =>
            {
                archiveReads++;
                var envelope = Convert.FromBase64String((await store.ReadAsync(uri, ct))!);
                byte[] recovered = new byte[envelope.Length - 28];
                cipher.Decrypt(envelope.AsSpan(0, 12), envelope.AsSpan(28), envelope.AsSpan(12, 16), recovered);
                return new(identity, HistoricalArtifactAvailability.Exact, new MemoryStream(recovered));
            };

            var reader = f.Reader();
            long started = Stopwatch.GetTimestamp();
            var restored = await reader.OpenReadAsync(f.Output, CancellationToken.None);
            var elapsed = Stopwatch.GetElapsedTime(started);
            Assert.Equal(HistoricalArtifactAvailability.Exact, restored!.Availability);
            await using (var actual = Assert.IsAssignableFrom<Stream>(restored.Content))
            {
                using var destination = new MemoryStream();
                await actual.CopyToAsync(destination, CancellationToken.None);
                Assert.Equal(plain, destination.ToArray());
            }
            Assert.Equal(1, archiveReads);
            var verified = Assert.Single(f.Logged);
            Assert.Equal(AuditEventTypes.HistoricalReplayArtifactVerifiedForUse, verified.EventType);
            Assert.Contains("\"source\":\"archive\"", verified.DataJson, StringComparison.Ordinal);
            Assert.DoesNotContain("archived-output", verified.DataJson, StringComparison.Ordinal);

            // The fallback path only stages verified bytes. It never rewrites the primary, archive, or sealed descriptor.
            Assert.Equal(stored.Length, new FileInfo(stored.FullName).Length);
            Assert.True(stored.Length > plain.Length);
            string? report = Environment.GetEnvironmentVariable("FND096_RESTORE_EVIDENCE");
            if (!string.IsNullOrWhiteSpace(report))
            {
                string full = Path.GetFullPath(report);
                Directory.CreateDirectory(Path.GetDirectoryName(full)!);
                string? price = Environment.GetEnvironmentVariable("FND096_USD_PER_GIB_MONTH");
                decimal? cost = decimal.TryParse(price, NumberStyles.AllowDecimalPoint, CultureInfo.InvariantCulture, out var rate) && rate > 0
                    ? rate * stored.Length / (1024m * 1024 * 1024) : null;
                await File.WriteAllTextAsync(full, JsonSerializer.Serialize(new
                {
                    backend = "Existing local-file artifact store; fixture AES-GCM envelope",
                    payloadBytes = plain.Length, storedBytes = stored.Length, elapsedMicroseconds = elapsed.TotalMicroseconds,
                    archiveReads, storageCostUsdPerMonthAtSuppliedRate = cost,
                }), CancellationToken.None);
            }
        }
        finally
        {
            Directory.Delete(root, recursive: true);
        }
    }

    [Fact]
    public async Task Durable_erasure_marker_blocks_all_copies_even_when_an_older_grant_still_looks_available()
    {
        var f = new Fixture();
        await f.Journal.RecordCompletedErasureAsync(f.Output, Guid.NewGuid(), "erasure-owner", CancellationToken.None);
        var result = await f.Reader().OpenReadAsync(f.Output, CancellationToken.None);

        Assert.Equal(HistoricalArtifactAvailability.Erased, result!.Availability);
        Assert.Null(result.Content);
        Assert.Empty(f.Primary.Calls);
        Assert.Empty(f.Archive.Calls);
        Assert.Empty(f.Logged);
        var marker = Assert.Single(f.Markers);
        Assert.Equal(f.Run.ProjectId, marker.ProjectId);
        Assert.DoesNotContain("archived-output", marker.DataJson, StringComparison.Ordinal);
        Assert.NotEqual(f.Output.ArtifactId, marker.CorrelationId);
        var anotherRun = new HistoricalRunIdentity(f.Run.Scope, f.Run.Product, Guid.NewGuid(), null, null);
        Assert.True(await f.Journal.IsErasedAsync(f.Output with { Run = anotherRun, Schema = "later-schema" }, CancellationToken.None));
        Assert.True(RequiredAuditEventTypes.IsRequired(AuditEventTypes.HistoricalReplayArtifactErased));
        Assert.True(RequiredAuditEventTypes.IsRequired(AuditEventTypes.HistoricalReplayArtifactVerifiedForUse));
    }

    [Fact]
    public async Task Erasure_committed_during_restore_disposes_the_file_stream_and_does_not_release_bytes()
    {
        var f = new Fixture();
        f.Primary.Lookup = (_, _) => ValueTask.FromResult<HistoricalArtifactRead?>(null);
        var stream = new TrackingStream(Fixture.Bytes("archived-output"));
        f.Archive.Lookup = async (identity, ct) =>
        {
            await f.Journal.RecordCompletedErasureAsync(identity, Guid.NewGuid(), "erasure-owner", ct);
            return new(identity, HistoricalArtifactAvailability.Exact, stream);
        };

        var result = await f.Reader().OpenReadAsync(f.Output, CancellationToken.None);
        Assert.Equal(HistoricalArtifactAvailability.Erased, result!.Availability);
        Assert.Null(result.Content);
        Assert.True(stream.WasDisposed);
        Assert.Empty(f.Logged);
        Assert.Single(f.Archive.Calls);
    }

    [Fact]
    public async Task Legal_hold_preserves_pending_erasure_but_never_grants_read_or_extends_expiry()
    {
        var f = new Fixture();
        var until = f.Now.AddDays(2);
        f.Current = stamp => stamp with { Lifecycle = HistoricalArtifactLifecycle.ErasureApproved, HoldUntilUtc = until };
        var held = await f.Reader().OpenReadAsync(f.Output, CancellationToken.None);
        Assert.Equal(HistoricalArtifactAvailability.AccessDenied, held!.Availability);
        Assert.Equal(HistoricalRetentionDisposition.PreserveForHold, HistoricalRetentionPolicyRules.AssessPreservation(
            HistoricalArtifactLifecycle.ErasureApproved, f.Now.AddDays(-1), until, null, f.Now));
        Assert.Equal(HistoricalRetentionDisposition.EligibleForAuthorizedPurge, HistoricalRetentionPolicyRules.AssessPreservation(
            HistoricalArtifactLifecycle.ErasureApproved, f.Now.AddDays(-1), until, null, until));

        f.Current = stamp => stamp with { HardExpiresUtc = f.Now, HoldUntilUtc = until };
        var expired = await f.Reader().OpenReadAsync(f.Output, CancellationToken.None);
        Assert.Equal(HistoricalArtifactAvailability.Expired, expired!.Availability);
        Assert.Empty(f.Primary.Calls);
        Assert.Empty(f.Archive.Calls);
    }

    [Fact]
    public async Task A_tenant_hold_does_not_bypass_its_existing_erasure_quarantine()
    {
        var f = new Fixture();
        f.Tenant = new TenantRecord { Id = f.Run.TenantId, DataRegion = "eastus", OffboardedUtc = f.Now.AddDays(-1),
            ErasureEligibleUtc = f.Now.AddDays(-1), LegalHoldUntilUtc = f.Now.AddDays(3) };
        var result = await f.Reader().OpenReadAsync(f.Output, CancellationToken.None);
        Assert.Equal(HistoricalArtifactAvailability.AccessDenied, result!.Availability);
        Assert.False(TenantErasureEligibility.IsEligibleForScheduledHardPurge(f.Tenant, f.Now));
        Assert.Empty(f.Primary.Calls);
    }

    [Fact]
    public async Task Exact_raw_bytes_require_an_explicit_raw_mode_rule_and_are_not_available_from_typed_or_derived_data()
    {
        var f = new Fixture();
        var raw = f.Identity("response");
        var typed = f.Identity("typed");
        var typedReader = f.Reader(HistoricalReplayMode.RecordedTyped);
        var denied = await typedReader.OpenReadAsync(raw, CancellationToken.None);
        var retained = await typedReader.OpenReadAsync(typed, CancellationToken.None);
        Assert.Equal(HistoricalArtifactAvailability.AccessDenied, denied!.Availability);
        Assert.Equal(HistoricalArtifactAvailability.Exact, retained!.Availability);
        await retained.Content!.DisposeAsync();

        f.Current = decision => decision with { Fidelity = HistoricalArtifactAvailability.Redacted };
        var redacted = await f.Reader(HistoricalReplayMode.RecordedRaw).OpenReadAsync(raw, CancellationToken.None);
        Assert.Equal(HistoricalArtifactAvailability.Redacted, redacted!.Availability);
        Assert.Null(redacted.Content);
        Assert.DoesNotContain(f.Primary.Calls, row => row.ArtifactId == "response");
    }

    [Fact]
    public void Uses_the_existing_always_on_redaction_shape_only_for_approved_derived_artifacts()
    {
        var redactor = new Mock<IPromptRedactor>(MockBehavior.Strict);
        redactor.Setup(service => service.RedactAlways("contains-test-secret")).Returns(
            new PromptRedactionOutcome("contains-[redacted]", new Dictionary<string, int> { ["fixture"] = 1 }));
        redactor.Setup(service => service.RedactAlways("ordinary")).Returns(
            new PromptRedactionOutcome("ordinary", new Dictionary<string, int>()));
        var rule = new HistoricalRetentionRule(HistoricalReplayMode.RecordedRaw, HistoricalArtifactRole.AcceptedRawResponse,
            30, AllowExactRaw: false, AllowArchiveRestore: false, AllowDerivedMetadata: true);
        var derived = HistoricalRetentionPolicyRules.PrepareDerived(rule, "contains-test-secret", redactor.Object);
        Assert.Equal(HistoricalArtifactAvailability.Redacted, derived!.Fidelity);
        Assert.DoesNotContain("secret", derived.Text, StringComparison.Ordinal);
        Assert.Equal(HistoricalArtifactAvailability.Derived,
            HistoricalRetentionPolicyRules.PrepareDerived(rule, "ordinary", redactor.Object)!.Fidelity);
        Assert.Null(HistoricalRetentionPolicyRules.PrepareDerived(rule with { AllowDerivedMetadata = false }, "neither", redactor.Object));
    }

    [Fact]
    public async Task Restoration_never_substitutes_tampered_or_wrong_scope_bytes()
    {
        var f = new Fixture();
        f.Primary.Lookup = (_, _) => ValueTask.FromResult<HistoricalArtifactRead?>(null);
        f.Archive.Lookup = (id, _) => ValueTask.FromResult<HistoricalArtifactRead?>(
            new(id, HistoricalArtifactAvailability.Exact, new MemoryStream(Fixture.Bytes("different-bytes"))));
        var corrupt = await f.Reader().OpenReadAsync(f.Output, CancellationToken.None);
        var foreign = new HistoricalRunIdentity(ProjectScopeKey.Create(f.Run.TenantId, f.Run.WorkspaceId, Guid.NewGuid()),
            f.Run.Product, f.Run.RunId, f.Run.SnapshotId, null);
        f.Archive.Lookup = (id, _) => ValueTask.FromResult<HistoricalArtifactRead?>(Fixture.Read(id with { Run = foreign }));
        var outside = await f.Reader().OpenReadAsync(f.Output, CancellationToken.None);
        f.Archive.Lookup = (id, _) => ValueTask.FromResult<HistoricalArtifactRead?>(Fixture.Read(id with { Schema = "other-schema" }));
        var incompatible = await f.Reader().OpenReadAsync(f.Output, CancellationToken.None);

        Assert.Equal(HistoricalArtifactAvailability.Tampered, corrupt!.Availability);
        Assert.Equal(HistoricalArtifactAvailability.AccessDenied, outside!.Availability);
        Assert.Equal(HistoricalArtifactAvailability.Incompatible, incompatible!.Availability);
        Assert.Empty(f.Logged);
    }

    [Fact]
    public async Task Corrupt_primary_is_not_silently_replaced_by_a_backup()
    {
        var f = new Fixture();
        f.Primary.Lookup = (id, _) => ValueTask.FromResult<HistoricalArtifactRead?>(
            new(id, HistoricalArtifactAvailability.Exact, new MemoryStream(Fixture.Bytes("tampered-primary"))));
        var result = await f.Reader().OpenReadAsync(f.Output, CancellationToken.None);

        Assert.Equal(HistoricalArtifactAvailability.Tampered, result!.Availability);
        Assert.Null(result.Content);
        Assert.Empty(f.Archive.Calls);
        Assert.Empty(f.Logged);
    }

    [Theory]
    [InlineData(true, true, false)]
    [InlineData(false, true, true)]
    [InlineData(true, false, true)]
    public async Task Reader_requires_approved_placement_and_consistent_erase_index_before_access(
        bool encrypted, bool correctRegion, bool eraseIndex)
    {
        var f = new Fixture();
        f.Current = row => row with { ErasureIndexCoversAllCopies = eraseIndex,
            Primary = row.Primary! with { EncryptedAtRest = encrypted, Region = correctRegion ? "eastus" : "westus2" } };
        var result = await f.Reader().OpenReadAsync(f.Output, CancellationToken.None);

        Assert.Equal(eraseIndex ? HistoricalArtifactAvailability.AccessDenied : HistoricalArtifactAvailability.Unknown, result!.Availability);
        Assert.Empty(f.Primary.Calls);
        Assert.Empty(f.Archive.Calls);
    }

    [Fact]
    public async Task A_hidden_optional_cache_does_not_count_as_historical_durability()
    {
        var f = new Fixture();
        f.Current = row => row.Identity.ArtifactId == "cache" ? row with { Durable = false } : row;
        var assessment = await f.Reader().AssessAsync();
        Assert.Equal(HistoricalReplayReadiness.Ready, assessment.Status);
        Assert.DoesNotContain(f.Primary.Calls, id => id.ArtifactId == "cache");

        var needed = f.Descriptor with
        {
            Artifacts = [.. f.Descriptor.Artifacts.Select(row => row.ArtifactId == "cache"
                ? row with { AdditionalRequirements = HistoricalRequiredModes.Reconstruction } : row)],
        };
        var required = await f.Reader(descriptor: needed).AssessAsync();
        Assert.Equal(HistoricalReplayReadiness.Partial, required.Status);
        Assert.Equal(HistoricalArtifactAvailability.Unknown, Assert.Single(required.Artifacts, row => row.ArtifactId == "cache").ObservedAvailability);
        Assert.DoesNotContain(f.Primary.Calls, id => id.ArtifactId == "cache");
    }

    [Fact]
    public async Task Access_is_rechecked_after_the_audit_write_before_releasing_bytes()
    {
        var f = new Fixture();
        var audit = new Mock<IAuditService>(MockBehavior.Strict);
        audit.Setup(port => port.LogAsync(It.IsAny<AuditEvent>(), CancellationToken.None)).Callback(() =>
            f.Current = stamp => stamp with { Revision = stamp.Revision + 1, Authorized = false }).Returns(Task.CompletedTask);
        var result = await f.Reader(audit: audit.Object).OpenReadAsync(f.Output, CancellationToken.None);
        Assert.Equal(HistoricalArtifactAvailability.AccessDenied, result!.Availability);
        Assert.Null(result.Content);
    }

    [Fact]
    public async Task Failed_durable_audit_does_not_release_a_verified_copy()
    {
        var f = new Fixture();
        var audit = new Mock<IAuditService>(MockBehavior.Strict);
        audit.Setup(port => port.LogAsync(It.IsAny<AuditEvent>(), CancellationToken.None)).ThrowsAsync(new IOException("test audit failure"));
        await Assert.ThrowsAsync<DurableAuditWriteFailedException>(async () =>
        {
            _ = await f.Reader(audit: audit.Object).OpenReadAsync(f.Output, CancellationToken.None);
        });
        Assert.Empty(f.Logged);
    }

    [Fact]
    public async Task A_changed_policy_or_expired_grant_is_not_replaced_with_current_artifacts()
    {
        var f = new Fixture();
        f.Current = decision => decision with { PolicySha256 = Hash };
        var changed = await f.Reader().OpenReadAsync(f.Output, CancellationToken.None);
        f.Current = decision => decision;
        var expired = await f.Reader(ends: f.Now).OpenReadAsync(f.Output, CancellationToken.None);
        Assert.Equal(HistoricalArtifactAvailability.AccessDenied, changed!.Availability);
        Assert.Equal(HistoricalArtifactAvailability.AccessDenied, expired!.Availability);
        Assert.Empty(f.Primary.Calls);
    }

    [Fact]
    public async Task Maximum_age_uses_original_capture_even_if_a_restore_has_a_newer_storage_timestamp()
    {
        var f = new Fixture();
        f.Clock.Advance(TimeSpan.FromDays(3));
        var result = await f.Reader().OpenReadAsync(f.Output, CancellationToken.None);
        Assert.Equal(HistoricalArtifactAvailability.Expired, result!.Availability);
        Assert.Empty(f.Primary.Calls);
        Assert.Empty(f.Archive.Calls);
    }

    private sealed class Fixture
    {
        internal readonly FakeTimeProvider Clock = new(new DateTimeOffset(2026, 11, 27, 12, 0, 0, TimeSpan.Zero));
        internal DateTimeOffset Now => Clock.GetUtcNow();
        internal HistoricalRunIdentity Run { get; }
        internal HistoricalReplayDescriptor Descriptor { get; }
        internal HistoricalRetentionPolicy Policy { get; }
        internal HistoricalErasureJournal Journal { get; }
        internal HistoricalArtifactIdentity Output => Identity("archived-output");
        internal TenantRecord Tenant { get; set; }
        internal List<AuditEvent> Markers { get; } = [];
        internal List<AuditEvent> Logged { get; } = [];
        internal StoreStub Primary { get; } = new();
        internal StoreStub Archive { get; } = new();
        internal Func<HistoricalRetentionDecision, HistoricalRetentionDecision> Current { get; set; } = row => row;
        private readonly Mock<ITenantDirectoryReader> tenants = new(MockBehavior.Strict);
        private readonly Mock<IAuditService> audit = new(MockBehavior.Strict);

        internal Fixture()
        {
            var scope = ProjectScopeKey.Create(Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid());
            Run = new(scope, HistoricalReplayProduct.ArchLucid, Guid.NewGuid(), null, null);
            Tenant = new TenantRecord { Id = scope.TenantId, DataRegion = "eastus" };
            var source = new HistoricalSourceAnchor(Run, HistoricalReplaySourceAnchors.AuthorityManifestScheme, Guid.NewGuid(), Hash);
            Descriptor = new(1, source, Now.AddDays(-1), HistoricalCoverage.Complete,
                new("engine", "runtime", "dependencies", "config", "output", "canonical"),
                [new("stage", HistoricalStageKind.Model, HistoricalCoverage.Complete, Now.AddDays(-1), [],
                    new("attempt", "prompt", "v1", "provider", "model", Hash, HistoricalAttemptDisposition.Accepted))],
                [Pin("archived-output", HistoricalArtifactRole.OriginalOutput), Pin("trace", HistoricalArtifactRole.DecisionTrace),
                 Pin("evidence", HistoricalArtifactRole.SourceEvidence), Pin("policy", HistoricalArtifactRole.EffectivePolicy),
                 Pin("response", HistoricalArtifactRole.AcceptedRawResponse, "stage", "attempt"),
                 Pin("typed", HistoricalArtifactRole.AcceptedTypedInput, "stage", "attempt"),
                 Pin("cache", HistoricalArtifactRole.Checkpoint, "stage")]);
            Policy = new(scope, Guid.NewGuid(), "revision-1", "eastus", Now.AddDays(-2), Now.AddDays(90),
                Enum.GetValues<HistoricalReplayMode>().SelectMany(mode => Descriptor.Artifacts
                    .Where(pin => !HistoricalRetentionPolicyRules.IsRaw(pin.Role) || mode == HistoricalReplayMode.RecordedRaw)
                    .Select(pin => new HistoricalRetentionRule(mode, pin.Role, 3,
                        HistoricalRetentionPolicyRules.IsRaw(pin.Role), true, true))).ToArray());

            tenants.Setup(port => port.GetByIdUncachedAsync(scope.TenantId, It.IsAny<CancellationToken>())).ReturnsAsync(() => Tenant);
            var journal = new Mock<IAuditRepository>(MockBehavior.Strict);
            journal.Setup(port => port.CountFilteredAsync(scope.TenantId, scope.WorkspaceId, scope.ProjectId,
                    It.IsAny<AuditEventFilter>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync((Guid _, Guid _, Guid _, AuditEventFilter filter, CancellationToken _) =>
                    Markers.Count(row => row.EventType == filter.EventType && row.CorrelationId == filter.CorrelationId));
            journal.Setup(port => port.AppendAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>(), null, null))
                .Callback((AuditEvent row, CancellationToken _, IDbConnection? _, IDbTransaction? _) => Markers.Add(row))
                .Returns(Task.CompletedTask);
            Journal = new(journal.Object, Clock, NullLogger<HistoricalErasureJournal>.Instance);
            audit.Setup(port => port.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()))
                .Callback((AuditEvent row, CancellationToken _) => Logged.Add(row)).Returns(Task.CompletedTask);
        }

        internal GovernedHistoricalReplayReader Reader(HistoricalReplayMode mode = HistoricalReplayMode.Reconstruction,
            HistoricalReplayDescriptor? descriptor = null, IAuditService? audit = null, DateTimeOffset? ends = null)
        {
            var input = descriptor ?? Descriptor;
            var approved = HistoricalRetentionPolicyRules.PolicySha256(Policy);
            HistoricalRetentionGrant grant = new(Run, mode, Guid.NewGuid(), "authorized-replay-user", ends ?? Now.AddDays(2));
            return new(new(input.Source, HistoricalReplayCompletenessService.DescriptorSha256(input)), input, Policy, approved,
                grant, tenants.Object, new AuthorityStub(identity => Current(new(identity, grant.GrantId, grant.ActorId, grant.Mode,
                    grant.EndsUtc, true, approved, 1, HistoricalArtifactLifecycle.Available, Now.AddDays(10), null, true, true,
                    HistoricalArtifactAvailability.Exact, new("primary", "eastus", true, true), new("archive", "eastus", true, true)))),
                Journal, audit ?? this.audit.Object, new("primary", Primary), new("archive", Archive), Clock,
                NullLogger<GovernedHistoricalReplayReader>.Instance);
        }

        internal HistoricalArtifactIdentity Identity(string id)
        {
            var pin = Assert.Single(Descriptor.Artifacts, row => row.ArtifactId == id);
            return new(Run, pin.ArtifactId, pin.Role, pin.Schema, pin.StageId, pin.AttemptId);
        }

        private HistoricalArtifactPin Pin(string id, HistoricalArtifactRole role, string? stage = null, string? attempt = null) =>
            new(id, role, "retained-v1", stage, attempt, Convert.ToHexString(SHA256.HashData(Bytes(id))), Bytes(id).Length,
                Now.AddDays(-1), HistoricalArtifactAvailability.Exact, HistoricalRequiredModes.None);

        internal static byte[] Bytes(string id) => Encoding.UTF8.GetBytes(id);
        internal static HistoricalArtifactRead Read(HistoricalArtifactIdentity id) =>
            new(id, HistoricalArtifactAvailability.Exact, new MemoryStream(Bytes(id.ArtifactId)));
    }

    private sealed class AuthorityStub(Func<HistoricalArtifactIdentity, HistoricalRetentionDecision> decide) : IHistoricalRetentionAuthority
    {
        public ValueTask<HistoricalRetentionDecision?> ReadCurrentAsync(HistoricalRetentionGrant grant, HistoricalArtifactIdentity identity,
            CancellationToken cancellationToken) => ValueTask.FromResult<HistoricalRetentionDecision?>(decide(identity));
    }

    private sealed class StoreStub : IScopedHistoricalArtifactReader
    {
        internal List<HistoricalArtifactIdentity> Calls { get; } = [];
        internal Func<HistoricalArtifactIdentity, CancellationToken, ValueTask<HistoricalArtifactRead?>> Lookup { get; set; } =
            (identity, _) => ValueTask.FromResult<HistoricalArtifactRead?>(Fixture.Read(identity));

        public ValueTask<HistoricalArtifactRead?> OpenReadAsync(HistoricalArtifactIdentity identity, CancellationToken cancellationToken)
        {
            Calls.Add(identity);
            return Lookup(identity, cancellationToken);
        }
    }

    private sealed class TrackingStream(byte[] bytes) : MemoryStream(bytes)
    {
        internal bool WasDisposed { get; private set; }

        protected override void Dispose(bool disposing)
        {
            WasDisposed = true;
            base.Dispose(disposing);
        }
    }
}
