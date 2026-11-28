using System.Diagnostics;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Text.Json.Nodes;

using ArchLucid.Application.Replay.Historical;
using ArchLucid.Application.Replay.Historical.Execution;
using ArchLucid.Application.Replay.Historical.Retention;
using ArchLucid.Core.Audit;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Audit;
using ArchLucid.Persistence.BlobStore;
using ArchLucid.Persistence.InfraEvidence;

using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Time.Testing;

using Moq;

using static ArchLucid.Application.Replay.Historical.Execution.RecordedReplayRecipe;

namespace ArchLucid.Application.Tests.Replay;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class RecordedHistoricalReplayTests
{
    [Theory]
    [InlineData(HistoricalReplayProduct.ArchLucid, HistoricalReplayMode.RecordedTyped)]
    [InlineData(HistoricalReplayProduct.ArchLucid, HistoricalReplayMode.RecordedRaw)]
    [InlineData(HistoricalReplayProduct.SecureNow, HistoricalReplayMode.RecordedTyped)]
    public async Task Authorized_plan_uses_only_pinned_inputs_and_releases_only_durably_audited_comparisons(
        HistoricalReplayProduct product, HistoricalReplayMode mode)
    {
        var f = new Fixture(product, mode);
        var before = JsonSerializer.Serialize(f.Descriptor);
        var result = await f.ReplayAsync();
        Assert.Equal(RecordedReplayOutcome.ReproducedWithinScope, result.Outcome);
        Assert.Equal(mode, result.Mode);
        Assert.All(result.Comparisons!, row => Assert.True(row.Matches));
        Assert.Equal(before, JsonSerializer.Serialize(f.Descriptor));
        Assert.NotNull(f.Input);
        Assert.Equal(f.Descriptor.RecordedUtc, f.Input.RecordedUtc);
        Assert.Equal(mode == HistoricalReplayMode.RecordedRaw, f.Input.Inputs.ContainsKey("raw"));
        Assert.DoesNotContain("expected", f.Input.Inputs.Keys);
        Assert.DoesNotContain("image", f.Input.Inputs.Keys);
        Assert.DoesNotContain("prompt", f.Input.Inputs.Keys);
        var audit = Assert.Single(f.Logged);
        Assert.True(RequiredAuditEventTypes.IsRequired(audit.EventType));
        Assert.Equal(result.AuditId!.Value.ToString("D"), audit.CorrelationId);
        Assert.Equal(f.Descriptor.Source.Run.ProjectId, audit.ProjectId);
        Assert.DoesNotContain("retired-model-secret-label", audit.DataJson!, StringComparison.Ordinal);
    }

    [Fact]
    public async Task Authorized_archive_restore_replays_via_real_governed_reader_without_rewriting_primary()
    {
        var f = new Fixture(HistoricalReplayProduct.ArchLucid, HistoricalReplayMode.RecordedTyped);
        var originals = f.Bytes.ToDictionary(row => row.Key, row => Convert.ToHexString(SHA256.HashData(row.Value)));
        f.Absent = "evidence";
        var reader = f.GovernedReader();
        var result = await f.Service().ReplayAsync(f.Trust, f.Descriptor, f.Grant, reader, TestContextToken);
        Assert.Equal(RecordedReplayOutcome.ReproducedWithinScope, result.Outcome);
        Assert.Equal("evidence", Assert.Single(f.Archive.Calls).ArtifactId);
        Assert.Single(f.Primary.Calls, row => row.ArtifactId == "evidence");
        Assert.Equal(originals, f.Bytes.ToDictionary(row => row.Key, row => Convert.ToHexString(SHA256.HashData(row.Value))));
        Assert.Contains(f.Logged, row => row.EventType == AuditEventTypes.HistoricalReplayArtifactVerifiedForUse
            && row.DataJson!.Contains("\"source\":\"archive\"", StringComparison.Ordinal));
    }

    [Fact]
    public async Task Changed_restore_custody_after_staging_suppresses_the_report()
    {
        var f = new Fixture(HistoricalReplayProduct.ArchLucid, HistoricalReplayMode.RecordedTyped) { Absent = "evidence" };
        f.OnExecute = _ =>
        {
            f.ChangeLease = true;
            return f.ExpectedOutput;
        };
        var result = await f.Service().ReplayAsync(f.Trust, f.Descriptor, f.Grant, f.GovernedReader(), TestContextToken);
        Assert.Equal(RecordedReplayOutcome.Rejected, result.Outcome);
        Assert.DoesNotContain(f.Logged, row => row.EventType == AuditEventTypes.HistoricalRecordedReplayCompleted);
    }

    [Theory]
    [InlineData(HistoricalArtifactAvailability.Missing)]
    [InlineData(HistoricalArtifactAvailability.Redacted)]
    [InlineData(HistoricalArtifactAvailability.Truncated)]
    [InlineData(HistoricalArtifactAvailability.Expired)]
    [InlineData(HistoricalArtifactAvailability.Erased)]
    [InlineData(HistoricalArtifactAvailability.Incompatible)]
    [InlineData(HistoricalArtifactAvailability.Tampered)]
    public async Task Required_raw_material_is_not_replaced_by_an_available_typed_result(HistoricalArtifactAvailability availability)
    {
        var f = new Fixture(HistoricalReplayProduct.ArchLucid, HistoricalReplayMode.RecordedRaw);
        f.Observe = id => id.ArtifactId == "raw"
            ? new(id, availability, null) : f.Read(id);
        var result = await f.ReplayAsync();
        Assert.Equal(RecordedReplayOutcome.Partial, result.Outcome);
        Assert.Contains(result.Assessment!.Artifacts, item => item.ArtifactId == "raw" && item.ObservedAvailability == availability);
        Assert.Null(f.Input);
        Assert.Empty(f.Logged);
    }

    [Theory]
    [InlineData(false)]
    [InlineData(true)]
    public async Task Changed_artifact_or_wrong_attempt_never_reaches_worker(bool wrongAttempt)
    {
        var f = new Fixture(HistoricalReplayProduct.ArchLucid, HistoricalReplayMode.RecordedRaw);
        f.Observe = id => id.ArtifactId != "raw" ? f.Read(id)
            : wrongAttempt ? f.Read(id) with { Identity = id with { AttemptId = "other-attempt" } }
            : new(id, HistoricalArtifactAvailability.Exact, new MemoryStream([.. f.Bytes["raw"], 42]));
        var result = await f.ReplayAsync();
        Assert.Equal(wrongAttempt ? RecordedReplayOutcome.Rejected : RecordedReplayOutcome.Partial, result.Outcome);
        Assert.Null(f.Input);
    }

    [Theory]
    [InlineData("tenant")]
    [InlineData("project")]
    [InlineData("execution-grant")]
    [InlineData("descriptor")]
    [InlineData("engine")]
    [InlineData("schema")]
    [InlineData("image")]
    [InlineData("budget")]
    public async Task Invalid_scope_authority_version_schema_and_budget_fail_closed(string variation)
    {
        var f = new Fixture();
        RecordedReplayImage approval = f.Approval;
        switch (variation)
        {
            case "tenant": f.Ambient.TenantId = Guid.NewGuid(); break;
            case "project": f.Ambient.ProjectId = Guid.NewGuid(); break;
            case "execution-grant": f.Authorized = false; break;
            case "descriptor": f.Descriptor = f.Descriptor with { RecordedUtc = f.Descriptor.RecordedUtc.AddMinutes(1) }; break;
            case "engine": approval = approval with { Versions = approval.Versions with { EngineBuild = "today" } }; break;
            case "schema": f.SetPin("evidence", pin => pin with { Schema = "future-schema" }); break;
            case "image": approval = approval with { ImageId = "sha256:" + new string('2', 64) }; break;
            case "budget": f.SetPin("evidence", pin => pin with { Length = MaxPlanCaptureBytes }); break;
        }
        var result = await f.ReplayAsync(approval);
        Assert.Equal(variation is "tenant" or "project" or "execution-grant" or "descriptor"
            ? RecordedReplayOutcome.Rejected : RecordedReplayOutcome.Unavailable, result.Outcome);
        Assert.Null(f.Input);
        Assert.Empty(f.Logged);
        if (variation != "image")
            Assert.Empty(f.Primary.Calls);
    }

    [Fact]
    public async Task An_unavailable_recorded_tool_result_never_falls_back_to_a_live_tool()
    {
        var f = new Fixture(HistoricalReplayProduct.ArchLucid, HistoricalReplayMode.RecordedTyped, withTool: true);
        f.Absent = "tool";
        var result = await f.ReplayAsync();
        Assert.Equal(RecordedReplayOutcome.Partial, result.Outcome);
        Assert.Contains(result.Assessment!.Artifacts, row => row.ArtifactId == "tool"
            && row.ObservedAvailability == HistoricalArtifactAvailability.Missing);
        Assert.Null(f.Input);
    }

    [Fact]
    public async Task Json_property_order_does_not_count_as_drift()
    {
        var f = new Fixture();
        var reordered = f.ExpectedOutput.Final.EnumerateObject().Reverse().ToDictionary(row => row.Name, row => row.Value);
        f.OnExecute = _ => f.ExpectedOutput with { Final = JsonSerializer.SerializeToElement(reordered) };
        Assert.Equal(RecordedReplayOutcome.ReproducedWithinScope, (await f.ReplayAsync()).Outcome);
    }

    [Fact]
    public async Task Security_relevant_difference_is_drift_and_not_a_rewrite()
    {
        var f = new Fixture();
        f.OnExecute = _ => f.ExpectedOutput with
        {
            Final = JsonSerializer.SerializeToElement(new { warning = "Recorded evidence reference changed." }),
        };
        var result = await f.ReplayAsync();
        Assert.Equal(RecordedReplayOutcome.DriftDetected, result.Outcome);
        Assert.Equal(new("final", false), result.Comparisons!.Last());
        Assert.Contains("DriftDetected", Assert.Single(f.Logged).DataJson!, StringComparison.Ordinal);
    }

    [Theory]
    [InlineData("worker")]
    [InlineData("audit")]
    [InlineData("revocation")]
    [InlineData("cancel")]
    public async Task Worker_failure_audit_failure_revocation_and_cancellation_never_return_success(string variation)
    {
        var f = new Fixture();
        using var ct = new CancellationTokenSource();
        switch (variation)
        {
            case "worker": f.OnExecute = _ => null; break;
            case "audit": f.FailAudit = true; break;
            case "revocation": f.OnExecute = _ => { f.Authorized = false; return f.ExpectedOutput; }; break;
            case "cancel": f.OnExecute = _ => { ct.Cancel(); throw new OperationCanceledException(ct.Token); };
                await Assert.ThrowsAnyAsync<OperationCanceledException>(() => f.ReplayAsync(ct: ct.Token));
                break;
        }
        if (variation == "audit")
            await Assert.ThrowsAsync<DurableAuditWriteFailedException>(() => f.ReplayAsync());
        else if (variation != "cancel")
        {
            var result = await f.ReplayAsync();
            Assert.Equal(variation == "revocation" ? RecordedReplayOutcome.Rejected : RecordedReplayOutcome.Unavailable, result.Outcome);
            Assert.Null(result.AuditId);
        }
        Assert.Empty(f.Logged);
    }

    internal static CancellationToken TestContextToken => CancellationToken.None;

    internal sealed class Fixture
    {
        private const string ImageId = "sha256:1111111111111111111111111111111111111111111111111111111111111111";
        private const string Target = "/subscriptions/test/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/replay";
        private static readonly JsonSerializerOptions Web = new(JsonSerializerDefaults.Web);
        private static readonly DateTimeOffset RecordedAt = new(2026, 4, 17, 10, 0, 0, TimeSpan.Zero);
        private readonly FakeTimeProvider clock = new(RecordedAt.AddDays(1));
        private readonly Mock<IScopeContextProvider> scopes = new(MockBehavior.Strict);
        private readonly Mock<IAuditService> audit = new(MockBehavior.Strict);
        private readonly Mock<IRecordedReplayAuthority> authority = new(MockBehavior.Strict);
        internal Dictionary<string, byte[]> Bytes { get; } = new(StringComparer.Ordinal);
        internal HistoricalReplayDescriptor Descriptor { get; set; }
        internal HistoricalReplayTrust Trust { get; private set; }
        internal RecordedReplayImage Approval { get; }
        internal HistoricalRetentionGrant Grant { get; }
        internal RecordedReplayWorkerOutput ExpectedOutput { get; }
        internal ScopeContext Ambient { get; set; }
        internal Store Primary { get; }
        internal Store Archive { get; }
        internal bool Authorized { get; set; } = true;
        internal bool FailAudit { get; set; }
        internal bool ChangeLease { get; set; }
        internal string? Absent { get; set; }
        internal List<AuditEvent> Logged { get; } = [];
        internal Func<HistoricalArtifactIdentity, HistoricalArtifactRead> Observe { get; set; }
        internal Func<RecordedReplayWorkerInput, RecordedReplayWorkerOutput?> OnExecute { get; set; }
        internal RecordedReplayWorkerInput? Input { get; private set; }

        internal Fixture(HistoricalReplayProduct product = HistoricalReplayProduct.SecureNow,
            HistoricalReplayMode mode = HistoricalReplayMode.RecordedTyped, string? image = null, bool withTool = false)
        {
            var run = new HistoricalRunIdentity(ProjectScopeKey.Create(Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid()), product,
                Guid.NewGuid(), product == HistoricalReplayProduct.SecureNow ? Guid.NewGuid() : null,
                product == HistoricalReplayProduct.SecureNow ? Guid.NewGuid() : null);
            Ambient = new() { TenantId = run.TenantId, WorkspaceId = run.WorkspaceId, ProjectId = run.ProjectId };
            var root = new HistoricalSourceAnchor(run, product == HistoricalReplayProduct.ArchLucid
                ? HistoricalReplaySourceAnchors.AuthorityManifestScheme : HistoricalReplaySourceAnchors.SecureNowInventoryScheme,
                run.SnapshotId ?? Guid.NewGuid(), new string('A', 64));
            var versions = new HistoricalExecutionVersions("historic-engine", "historic-runtime", "historic-dependencies", "pinned-config",
                product == HistoricalReplayProduct.ArchLucid ? AuthorityOutput : SecureNowOutput, Canonicalization);
            Approval = new(product, mode, versions, image ?? ImageId);
            Grant = new(run, mode, Guid.NewGuid(), "replay-test-actor", clock.GetUtcNow().AddHours(1));

            Dictionary<string, JsonElement> stages = new(StringComparer.Ordinal);
            HistoricalStagePin[] stagePins;
            List<HistoricalArtifactPin> pins = [];
            if (product == HistoricalReplayProduct.ArchLucid)
            {
                const string resultId = "result-pinned";
                const string taskId = "task-pinned";
                const string claim = "Recorded policy finding";
                const string known = "historical-evidence-1";
                const string unknown = "historical-evidence-missing";
                string[] claims = [claim];
                string[] evidenceRefs = [known, unknown];
                var payload = new { resultId, taskId, runId = run.RunId.ToString("D"), agentType = "Compliance",
                    claims, evidenceRefs, confidence = 0.75, createdUtc = RecordedAt };
                Bytes["typed"] = JsonSerializer.SerializeToUtf8Bytes(payload, Web);
                Bytes["raw"] = JsonSerializer.SerializeToUtf8Bytes(payload, Web);
                Bytes["evidence"] = JsonSerializer.SerializeToUtf8Bytes(new { references = new[] { known } });
                Bytes["policy"] = JsonSerializer.SerializeToUtf8Bytes(new { enforceAgentSchema = true });
                Bytes["configuration"] = JsonSerializer.SerializeToUtf8Bytes(new { taskId, agentType = 3 });
                stages[AgentStage] = JsonSerializer.SerializeToElement(new
                { resultId, runId = run.RunId.ToString("D"), taskId, agentType = "Compliance", claims, evidenceRefs, confidence = 0.75 });
                stages[AuthorityStage] = JsonSerializer.SerializeToElement(new
                { recordedUtc = RecordedAt, resultId, claims, confidence = 0.75, resolvedEvidence = new[] { known }, unresolvedEvidence = new[] { unknown } });
                stagePins =
                [
                    new(AgentStage, HistoricalStageKind.Model, HistoricalCoverage.Complete, RecordedAt, [],
                        new("accepted-1", "template", "v1", "retired-provider", "retired-model-secret-label",
                            new string('B', 64), HistoricalAttemptDisposition.Accepted)),
                    new(AuthorityStage, HistoricalStageKind.Deterministic, HistoricalCoverage.Complete, RecordedAt, [AgentStage], null),
                ];
                if (withTool)
                {
                    stagePins[1] = stagePins[1] with { Dependencies = [AgentStage, ToolStage] };
                    stagePins = [.. stagePins, new(ToolStage, HistoricalStageKind.ExternalTool, HistoricalCoverage.Complete, RecordedAt, [],
                        new("accepted-tool", null, null, null, null, null, HistoricalAttemptDisposition.Accepted))];
                    Bytes["tool"] = JsonSerializer.SerializeToUtf8Bytes(new { references = new[] { unknown } });
                    stages[ToolStage] = JsonSerializer.SerializeToElement(new { references = new[] { unknown } });
                    stages[AuthorityStage] = JsonSerializer.SerializeToElement(new { recordedUtc = RecordedAt, resultId, claims,
                        confidence = 0.75, resolvedEvidence = new[] { known, unknown }, unresolvedEvidence = Array.Empty<string>() });
                }
                if (mode == HistoricalReplayMode.RecordedRaw)
                {
                    Bytes["prompt"] = Encoding.UTF8.GetBytes("authorized archived prompt");
                    pins.Add(Pin("prompt", HistoricalArtifactRole.AcceptedPrompt, "prompt-v1", AgentStage));
                }
            }
            else
            {
                var captured = RecordedAt.AddHours(-1);
                var rowId = Guid.NewGuid();
                var snapshot = new AzureInventorySnapshotDetailReadModel
                {
                    Header = new()
                    {
                        SnapshotId = run.SnapshotId!.Value, TenantId = run.TenantId, WorkspaceId = run.WorkspaceId, ProjectId = run.ProjectId,
                        SubscriptionId = "test", CapturedUtc = captured.UtcDateTime, CaptureStatus = AzureInventoryCaptureStatus.Succeeded,
                        CompletenessScore = 1m, ContentHashSha256 = Convert.FromHexString(root.CommitmentSha256),
                    },
                    Resources = [new() { SnapshotId = run.SnapshotId.Value, TenantId = run.TenantId, ResourceRowId = rowId,
                        ResourceType = "Microsoft.Storage/storageAccounts", AzureResourceId = Target, SubscriptionId = "test" }],
                    Properties = [new() { ResourceRowId = rowId, PropertyKey = "publicNetworkAccess", PropertyValue = "Enabled" }],
                };
                Bytes["evidence"] = JsonSerializer.SerializeToUtf8Bytes(snapshot, Web);
                Bytes["policy"] = JsonSerializer.SerializeToUtf8Bytes(new { maximumCaptureAgeHours = 24 });
                Bytes["configuration"] = JsonSerializer.SerializeToUtf8Bytes(new { target = Target });
                stages[SecureNowStage] = JsonSerializer.SerializeToElement(new
                {
                    snapshotId = run.SnapshotId.Value, findingId = run.FindingId, captureUtc = captured, recordedUtc = RecordedAt,
                    target = Target, directExposureEvidence = "present",
                    hops = new[] { new { fromNodeId = "internet://public-exposure", toNodeId = Target, edgeType = "public-network-access",
                        provenance = "ObservedFact", inferenceSource = (string?)null } },
                });
                stagePins = [new(SecureNowStage, HistoricalStageKind.Deterministic, HistoricalCoverage.Complete, RecordedAt, [], null)];
            }

            Bytes["image"] = Encoding.ASCII.GetBytes(Approval.ImageId);
            Bytes["runtime"] = Bytes["image"].ToArray();
            Bytes["trace"] = Encoding.UTF8.GetBytes("sealed original trace");
            foreach (var stage in stages)
                Bytes["stage:" + stage.Key] = JsonSerializer.SerializeToUtf8Bytes(stage.Value);
            ExpectedOutput = new(stages, stages[product == HistoricalReplayProduct.ArchLucid ? AuthorityStage : SecureNowStage]);
            Bytes["expected"] = JsonSerializer.SerializeToUtf8Bytes(ExpectedOutput.Final);
            pins.AddRange(Bindings(product, mode, withTool).Select(row => Pin(row.Name, row.Role, row.Schema, row.Stage)));
            pins.Add(Pin("trace", HistoricalArtifactRole.DecisionTrace, "trace-v1"));
            Descriptor = new(1, root, RecordedAt, HistoricalCoverage.Complete, versions, stagePins, pins);
            Trust = new(root, HistoricalReplayCompletenessService.DescriptorSha256(Descriptor));

            Observe = Read;
            Primary = new(id => id.ArtifactId == Absent ? null : Observe(id));
            Archive = new(Read);
            OnExecute = _ => ExpectedOutput;
            scopes.Setup(port => port.GetCurrentScope()).Returns(() => Ambient);
            authority.Setup(port => port.IsAuthorizedAsync(Grant, It.IsAny<string>(), It.IsAny<CancellationToken>())).ReturnsAsync(() => Authorized);
            audit.Setup(port => port.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>())).Returns((AuditEvent row, CancellationToken _) =>
            {
                if (FailAudit)
                    throw new IOException("synthetic audit failure");
                Logged.Add(row);
                return Task.CompletedTask;
            });
        }

        internal HistoricalArtifactRead Read(HistoricalArtifactIdentity id) =>
            new(id, HistoricalArtifactAvailability.Exact, new MemoryStream(Bytes[id.ArtifactId], writable: false));

        internal void SetPin(string id, Func<HistoricalArtifactPin, HistoricalArtifactPin> change)
        {
            Descriptor = Descriptor with { Artifacts = Descriptor.Artifacts.Select(row => row.ArtifactId == id ? change(row) : row).ToArray() };
            Trust = Trust with { DescriptorSha256 = HistoricalReplayCompletenessService.DescriptorSha256(Descriptor) };
        }

        internal void Replace(string id, byte[] value)
        {
            Bytes[id] = value;
            SetPin(id, row => row with { Length = value.Length, Sha256 = Convert.ToHexString(SHA256.HashData(value)) });
        }

        internal RecordedHistoricalReplay Service(IRecordedReplayWorker? worker = null, RecordedReplayImage? approval = null) =>
            new(authority.Object, scopes.Object, audit.Object, clock, NullLogger<RecordedHistoricalReplay>.Instance,
                worker ?? new Worker(this), [approval ?? Approval]);

        internal Task<RecordedReplayResult> ReplayAsync(RecordedReplayImage? approval = null, CancellationToken ct = default) =>
            Service(approval: approval).ReplayVerifiedAsync(Trust, Descriptor, Grant, Primary, (_, _) => ValueTask.FromResult(true), ct);

        internal GovernedHistoricalReplayReader GovernedReader()
        {
            var scope = Grant.Run.Scope;
            var policy = new HistoricalRetentionPolicy(scope, Guid.NewGuid(), "approved-v1", "eastus",
                RecordedAt.AddDays(-1), RecordedAt.AddDays(10), Descriptor.Artifacts.Select(row => row.Role).Distinct()
                    .Select(role => new HistoricalRetentionRule(Grant.Mode, role, 10, HistoricalRetentionPolicyRules.IsRaw(role), true, true)).ToArray());
            var digest = HistoricalRetentionPolicyRules.PolicySha256(policy);
            var tenants = new Mock<ITenantDirectoryReader>(MockBehavior.Strict);
            tenants.Setup(port => port.GetByIdUncachedAsync(scope.TenantId, It.IsAny<CancellationToken>()))
                .ReturnsAsync(new TenantRecord { Id = scope.TenantId, DataRegion = "eastus" });
            var journal = new Mock<IAuditRepository>(MockBehavior.Strict);
            journal.Setup(port => port.HasCommittedEventAsync(scope, AuditEventTypes.HistoricalReplayArtifactErased,
                    It.IsAny<string>(), It.IsAny<CancellationToken>())).ReturnsAsync(false);
            var custody = new Mock<IHistoricalRetentionAuthority>(MockBehavior.Strict);
            custody.Setup(port => port.ReadCurrentAsync(Grant, It.IsAny<HistoricalArtifactIdentity>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync((HistoricalRetentionGrant _, HistoricalArtifactIdentity id, CancellationToken _) =>
                    new HistoricalRetentionDecision(id, Grant.GrantId, Grant.ActorId, Grant.Mode, Grant.EndsUtc, true, digest,
                        ChangeLease ? 2 : 1, HistoricalArtifactLifecycle.Available, RecordedAt.AddDays(7), null, true, true,
                        HistoricalArtifactAvailability.Exact, new("primary", "eastus", true, true), new("archive", "eastus", true, true)));
            return new(Trust, Descriptor, policy, digest, Grant, tenants.Object, custody.Object,
                new HistoricalErasureJournal(journal.Object, scopes.Object, clock, NullLogger<HistoricalErasureJournal>.Instance),
                audit.Object, new("primary", Primary), new("archive", Archive), clock, NullLogger<GovernedHistoricalReplayReader>.Instance);
        }

        private HistoricalArtifactPin Pin(string id, HistoricalArtifactRole role, string schema, string? stage = null) =>
            new(id, role, schema, stage, role is HistoricalArtifactRole.AcceptedTypedInput or HistoricalArtifactRole.AcceptedRawResponse
                or HistoricalArtifactRole.AcceptedPrompt ? "accepted-1" : role == HistoricalArtifactRole.ExternalToolResult ? "accepted-tool" : null, Convert.ToHexString(SHA256.HashData(Bytes[id])),
                Bytes[id].Length, RecordedAt, HistoricalArtifactAvailability.Exact, HistoricalRequiredModes.None);

        private sealed class Worker(Fixture fixture) : IRecordedReplayWorker
        {
            public Task<RecordedReplayWorkerOutput?> RunAsync(string imageId, RecordedReplayWorkerInput input, CancellationToken cancellationToken)
            {
                Assert.Equal(fixture.Approval.ImageId, imageId);
                fixture.Input = input;
                return Task.FromResult(fixture.OnExecute(input));
            }
        }

        internal sealed class Store(Func<HistoricalArtifactIdentity, HistoricalArtifactRead?> read) : IScopedHistoricalArtifactReader
        {
            internal List<HistoricalArtifactIdentity> Calls { get; } = [];
            internal Func<HistoricalArtifactIdentity, CancellationToken, ValueTask<HistoricalArtifactRead?>>? Override { get; set; }

            public ValueTask<HistoricalArtifactRead?> OpenReadAsync(HistoricalArtifactIdentity identity, CancellationToken cancellationToken)
            {
                Calls.Add(identity);
                return Override is null ? ValueTask.FromResult(read(identity)) : Override(identity, cancellationToken);
            }
        }
    }
}

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class RecordedReplayWorkerIntegrationTests
{
    [SkippableTheory]
    [InlineData(HistoricalReplayProduct.ArchLucid, HistoricalReplayMode.RecordedTyped, false)]
    [InlineData(HistoricalReplayProduct.ArchLucid, HistoricalReplayMode.RecordedRaw, false)]
    [InlineData(HistoricalReplayProduct.SecureNow, HistoricalReplayMode.RecordedTyped, false)]
    [InlineData(HistoricalReplayProduct.ArchLucid, HistoricalReplayMode.RecordedRaw, true)]
    [InlineData(HistoricalReplayProduct.SecureNow, HistoricalReplayMode.RecordedTyped, true)]
    public async Task Both_products_execute_the_independent_projection_and_reject_malformed_raw_or_stale_capture(
        HistoricalReplayProduct product, HistoricalReplayMode mode, bool negative)
    {
        var image = Environment.GetEnvironmentVariable("FND095_TEST_IMAGE");
        var dll = Environment.GetEnvironmentVariable("FND095_TEST_WORKER_DLL");
        Skip.If(image is null && dll is null, "Requires the focused worker verification lane or a local network namespace.");
        var watch = Stopwatch.StartNew();
        var f = new RecordedHistoricalReplayTests.Fixture(product, mode, image, withTool: mode == HistoricalReplayMode.RecordedRaw);
        if (negative)
        {
            if (product == HistoricalReplayProduct.ArchLucid)
                f.Replace("raw", Encoding.UTF8.GetBytes("{\"resultId\":\"unparseable-for-this-run\"}"));
            else
            {
                var evidence = JsonNode.Parse(f.Bytes["evidence"])!;
                evidence["header"]!["capturedUtc"] = f.Descriptor.RecordedUtc.UtcDateTime.AddHours(-48);
                f.Replace("evidence", JsonSerializer.SerializeToUtf8Bytes(evidence));
            }
        }
        IRecordedReplayWorker worker = image is not null ? new IsolatedRecordedReplayWorker() : new NamespaceWorker(dll!);
        using var deadline = new CancellationTokenSource(TimeSpan.FromSeconds(45));
        var restored = !negative && product == HistoricalReplayProduct.ArchLucid && mode == HistoricalReplayMode.RecordedTyped;
        var result = restored
            ? await ReplayFromEncryptedArchiveAsync(f, worker, deadline.Token)
            : await f.Service(worker).ReplayAsync(f.Trust, f.Descriptor, f.Grant, f.GovernedReader(), deadline.Token);
        Assert.Equal(negative ? RecordedReplayOutcome.Unavailable : RecordedReplayOutcome.ReproducedWithinScope, result.Outcome);
        if (!negative)
        {
            var evidence = Environment.GetEnvironmentVariable("FND095_REPLAY_EVIDENCE_DIR");
            if (!string.IsNullOrEmpty(evidence))
            {
                Directory.CreateDirectory(evidence);
                await File.WriteAllTextAsync(Path.Combine(evidence, $"{product}-{mode}.json"), JsonSerializer.Serialize(new
                {
                    product = product.ToString(), mode = mode.ToString(), elapsedMilliseconds = watch.Elapsed.TotalMilliseconds,
                    scope = result.Reason, outcome = result.Outcome.ToString(), image, restored, stagesAndFinal = result.Comparisons!.Count,
                }), deadline.Token);
            }
        }
    }

    private static async Task<RecordedReplayResult> ReplayFromEncryptedArchiveAsync(RecordedHistoricalReplayTests.Fixture f,
        IRecordedReplayWorker worker, CancellationToken ct)
    {
        var root = Directory.CreateTempSubdirectory("fnd095-archive-");
        try
        {
            var scopes = new Mock<IScopeContextProvider>(MockBehavior.Strict);
            scopes.Setup(port => port.GetCurrentScope()).Returns(f.Ambient);
            IArtifactBlobStore store = new LocalFileArtifactBlobStore(root.FullName, scopes.Object);
            byte[] source = f.Bytes["evidence"];
            byte[] nonce = RandomNumberGenerator.GetBytes(12);
            byte[] tag = new byte[16];
            byte[] encrypted = new byte[source.Length];
            using var cipher = new AesGcm(RandomNumberGenerator.GetBytes(32), tag.Length);
            cipher.Encrypt(nonce, source, encrypted, tag);
            var envelope = Convert.ToBase64String([.. nonce, .. tag, .. encrypted]);
            var uri = await store.WriteAsync("historical", "pinned-evidence", envelope, ct);
            f.Absent = "evidence";
            f.Archive.Override = async (id, token) =>
            {
                var stored = Convert.FromBase64String((await store.ReadAsync(uri, token))!);
                var recovered = new byte[stored.Length - 28];
                cipher.Decrypt(stored.AsSpan(0, 12), stored.AsSpan(28), stored.AsSpan(12, 16), recovered);
                return new(id, HistoricalArtifactAvailability.Exact, new MemoryStream(recovered));
            };
            var result = await f.Service(worker).ReplayAsync(f.Trust, f.Descriptor, f.Grant, f.GovernedReader(), ct);
            Assert.Equal("evidence", Assert.Single(f.Archive.Calls).ArtifactId);
            Assert.Equal(envelope, await store.ReadAsync(uri, ct));
            Assert.Contains(f.Logged, row => row.EventType == AuditEventTypes.HistoricalReplayArtifactVerifiedForUse
                && row.DataJson!.Contains("\"source\":\"archive\"", StringComparison.Ordinal));
            return result;
        }
        finally
        {
            root.Delete(recursive: true);
        }
    }

    // Local evidence uses a fresh Linux network namespace. The focused CI lane always exercises the container worker instead.
    private sealed class NamespaceWorker(string dll) : IRecordedReplayWorker
    {
        public async Task<RecordedReplayWorkerOutput?> RunAsync(string imageId, RecordedReplayWorkerInput input, CancellationToken cancellationToken)
        {
            var dotnet = Environment.GetEnvironmentVariable("FND095_TEST_DOTNET") ?? throw new InvalidOperationException();
            var start = new ProcessStartInfo("/usr/bin/unshare") { UseShellExecute = false,
                RedirectStandardInput = true, RedirectStandardOutput = true, RedirectStandardError = true };
            start.Environment.Clear();
            start.Environment["DOTNET_EnableDiagnostics"] = "0";
            const string confirmIsolated = """
                test "$(tail -n +3 /proc/net/dev | cut -d : -f 1 | tr -d '[:space:]')" = lo
                test "$(wc -l < /proc/net/route)" -le 1
                exec "$@"
                """;
            start.Environment["PATH"] = "/usr/bin:/bin";
            foreach (var argument in new[] { "-Urn", "/bin/sh", "-ec", confirmIsolated, "replay-worker", dotnet, dll })
                start.ArgumentList.Add(argument);
            using var child = Process.Start(start) ?? throw new InvalidOperationException("Could not start isolated fixture worker.");
            var error = child.StandardError.ReadToEndAsync(cancellationToken);
            try
            {
                await JsonSerializer.SerializeAsync(child.StandardInput.BaseStream, input, cancellationToken: cancellationToken);
                child.StandardInput.Close();
                var output = await child.StandardOutput.ReadToEndAsync(cancellationToken);
                await child.WaitForExitAsync(cancellationToken);
                Assert.True(string.IsNullOrEmpty(await error));
                return child.ExitCode == 0 ? JsonSerializer.Deserialize<RecordedReplayWorkerOutput>(output) : null;
            }
            finally
            {
                if (!child.HasExited)
                    child.Kill(entireProcessTree: true);
            }
        }
    }
}
