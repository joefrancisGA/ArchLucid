using System.Security.Cryptography;
using System.Text;
using System.Text.Json;

using ArchLucid.Application.Replay.Historical;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Persistence.Artifacts;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Manifest;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Services;
using ArchLucid.Persistence.Models;
using ArchLucid.Persistence.Queries;

using Moq;

namespace ArchLucid.Application.Tests.Replay;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class HistoricalReplayCompletenessTests
{
    [Theory]
    [InlineData(HistoricalReplayProduct.ArchLucid)]
    [InlineData(HistoricalReplayProduct.SecureNow)]
    public async Task Both_product_anchors_verify_complete_historical_inputs_without_touching_the_original(HistoricalReplayProduct product)
    {
        var f = new Fixture(product);
        var json = JsonSerializer.Serialize(f.Descriptor);
        var decoded = Assert.IsType<HistoricalReplayDescriptor>(JsonSerializer.Deserialize<HistoricalReplayDescriptor>(json));
        Assert.Equal(f.Descriptor.Source, decoded.Source);
        var result = await f.RunAsync(HistoricalReplayMode.RecordedRaw, decoded);

        Assert.Equal(HistoricalReplayReadiness.Ready, result.Status);
        Assert.Equal(f.Digest, result.DescriptorSha256);
        Assert.Equal(HistoricalCoverage.Complete, result.SourceCoverage);
        Assert.Empty(result.Issues);
        Assert.All(result.Artifacts.Where(row => row.Required), row => Assert.Equal(HistoricalArtifactAvailability.Exact, row.ObservedAvailability));
        Assert.Equal(json, JsonSerializer.Serialize(f.Descriptor));
        Assert.Equal(f.Source, f.ResolveExistingAnchor());
        if (product == HistoricalReplayProduct.ArchLucid)
        {
            Assert.NotNull(f.Source.EvidencePackagePinSha256);
            Assert.NotNull(f.Source.PolicyPackPinSha256);
        }
        Assert.DoesNotContain(f.Reader.Calls, row => row.ArtifactId == "optional-cache");
    }

    [Fact]
    public async Task Retirement_or_current_configuration_cannot_substitute_for_the_historical_runtime()
    {
        var f = new Fixture();
        var current = f.Descriptor.Versions! with { EngineBuild = "new-build", ConfigurationVersion = "current-policy-config" };
        var reconstructed = await f.Service.AssessAsync(f.Trust, f.Descriptor, HistoricalReplayMode.Reconstruction, current);
        var wantsReplay = await f.Service.AssessAsync(f.Trust, f.Descriptor, HistoricalReplayMode.RecordedTyped, current);
        var noRuntime = await f.Service.AssessAsync(f.Trust, f.Descriptor, HistoricalReplayMode.RecordedTyped);

        Assert.Equal(HistoricalReplayReadiness.Ready, reconstructed.Status);
        Assert.Equal(HistoricalReplayReadiness.Partial, wantsReplay.Status);
        Assert.Contains(wantsReplay.Issues, issue => issue.Reason == "pinned_runtime_missing_or_incompatible");
        Assert.Equal(HistoricalReplayReadiness.Partial, noRuntime.Status);
    }

    [Theory]
    [InlineData(HistoricalArtifactAvailability.Derived)]
    [InlineData(HistoricalArtifactAvailability.Redacted)]
    [InlineData(HistoricalArtifactAvailability.Truncated)]
    [InlineData(HistoricalArtifactAvailability.Expired)]
    [InlineData(HistoricalArtifactAvailability.Erased)]
    [InlineData(HistoricalArtifactAvailability.Missing)]
    public async Task Raw_data_loss_cannot_be_papered_over_by_a_valid_typed_result(HistoricalArtifactAvailability state)
    {
        var f = new Fixture();
        var reviewed = f.WithArtifact("response", row => row with { RecordedAvailability = state });
        var typed = await f.RunAsync(HistoricalReplayMode.RecordedTyped, reviewed);
        var raw = await f.RunAsync(HistoricalReplayMode.RecordedRaw, reviewed);

        Assert.Equal(HistoricalReplayReadiness.Ready, typed.Status);
        Assert.Equal(HistoricalReplayReadiness.Partial, raw.Status);
        Assert.Equal(state, Find(raw, "response").ObservedAvailability);
        Assert.Equal(HistoricalArtifactAvailability.Exact, Find(raw, "typed").ObservedAvailability);
        Assert.DoesNotContain(f.Reader.Calls, row => row.ArtifactId == "response");
    }

    [Fact]
    public async Task A_missing_artifact_and_an_incompatible_stored_schema_are_reported_separately()
    {
        var f = new Fixture();
        f.Reader.Resolve = identity => identity.ArtifactId switch
        {
            "trace" => null,
            "policy" => Fixture.Read(identity with { Schema = "schema-v2" }),
            _ => Fixture.Read(identity),
        };

        var result = await f.RunAsync();
        Assert.Equal(HistoricalReplayReadiness.Partial, result.Status);
        Assert.Equal(HistoricalArtifactAvailability.Missing, Find(result, "trace").ObservedAvailability);
        Assert.Equal(HistoricalArtifactAvailability.Incompatible, Find(result, "policy").ObservedAvailability);
    }

    [Fact]
    public async Task A_changed_byte_or_appended_suffix_is_detected_and_the_owned_stream_is_disposed()
    {
        var f = new Fixture();
        byte[] exact = Fixture.Bytes("manifest");
        var appended = new ObservedStream([.. exact, 0, 1, 2, 3]);
        f.Reader.Resolve = id => id.ArtifactId switch
        {
            "manifest" => new(id, HistoricalArtifactAvailability.Exact, appended),
            "evidence" => new(id, HistoricalArtifactAvailability.Exact, new MemoryStream(Fixture.Bytes("EVIDENCE"))),
            _ => Fixture.Read(id),
        };

        var result = await f.RunAsync();
        Assert.Equal(HistoricalReplayReadiness.Partial, result.Status);
        Assert.Equal(HistoricalArtifactAvailability.Tampered, Find(result, "manifest").ObservedAvailability);
        Assert.Equal(HistoricalArtifactAvailability.Tampered, Find(result, "evidence").ObservedAvailability);
        Assert.Equal(exact.Length + 1, appended.BytesRead);
        Assert.True(appended.Disposed);
    }

    [Fact]
    public async Task Missing_authority_and_tampered_descriptor_fail_before_artifact_access()
    {
        var f = new Fixture();
        var modified = f.WithArtifact("policy", row => row with { Sha256 = new string('0', 64) });
        var mismatched = await f.Service.AssessAsync(f.Trust, modified, HistoricalReplayMode.Reconstruction);
        var unsealed = await f.Service.AssessAsync(f.Trust with { DescriptorSha256 = null }, f.Descriptor,
            HistoricalReplayMode.Reconstruction);
        var unsupported = await f.Service.AssessAsync(f.Trust, f.Descriptor with { Version = 97 }, HistoricalReplayMode.Reconstruction);

        Assert.All(new[] { mismatched, unsealed, unsupported }, result => Assert.Equal(HistoricalReplayReadiness.Rejected, result.Status));
        Assert.Empty(f.Reader.Calls);
    }

    [Theory]
    [InlineData(true)]
    [InlineData(false)]
    public async Task Foreign_tenant_or_project_artifacts_are_rejected_as_a_unit(bool swapTenant)
    {
        var f = new Fixture();
        var run = f.Source.Run;
        var foreignScope = ProjectScopeKey.Create(swapTenant ? Guid.NewGuid() : run.Scope.TenantId,
            run.Scope.WorkspaceId, swapTenant ? run.Scope.ProjectId : Guid.NewGuid());
        var identity = new HistoricalRunIdentity(foreignScope, run.Product, run.RunId, run.SnapshotId, run.FindingId);
        f.Reader.Resolve = artifact => Fixture.Read(artifact with { Run = identity });

        var result = await f.RunAsync();
        Assert.Equal(HistoricalReplayReadiness.Rejected, result.Status);
        Assert.Empty(result.Artifacts);
        Assert.Single(f.Reader.Calls);
    }

    [Fact]
    public async Task A_different_attempt_in_the_descriptor_or_the_returned_input_is_rejected()
    {
        var f = new Fixture();
        var wrongAttempt = f.WithArtifact("typed", row => row with { AttemptId = "other-attempt" });
        var invalid = await f.Service.AssessAsync(f.Trust, wrongAttempt, HistoricalReplayMode.RecordedTyped, f.Descriptor.Versions);
        Assert.Equal(HistoricalReplayReadiness.Rejected, invalid.Status);
        Assert.Empty(f.Reader.Calls);

        f.Reader.Resolve = identity => Fixture.Read(identity.ArtifactId == "typed" ? identity with { AttemptId = "other-attempt" } : identity);
        var falseReturn = await f.RunAsync(HistoricalReplayMode.RecordedTyped);
        Assert.Equal(HistoricalReplayReadiness.Rejected, falseReturn.Status);
        Assert.Empty(falseReturn.Artifacts);
    }

    [Fact]
    public async Task A_descriptors_stage_metadata_cannot_drop_mandatory_trace_evidence_or_rerun_incomplete_capture()
    {
        var f = new Fixture();
        var noTrace = f.Descriptor with { Artifacts = f.Descriptor.Artifacts.Where(row => row.Role != HistoricalArtifactRole.DecisionTrace).ToArray() };
        var incomplete = f.Descriptor with { SourceCoverage = HistoricalCoverage.Partial };
        var reconstruction = await f.RunAsync(HistoricalReplayMode.Reconstruction, incomplete);
        var typed = await f.RunAsync(HistoricalReplayMode.RecordedTyped, incomplete);

        Assert.Equal(HistoricalReplayReadiness.Partial, (await f.RunAsync(raw: noTrace)).Status);
        Assert.Equal(HistoricalReplayReadiness.Ready, reconstruction.Status);
        Assert.Equal(HistoricalCoverage.Partial, reconstruction.SourceCoverage);
        Assert.Equal(HistoricalReplayReadiness.Partial, typed.Status);
        Assert.Contains(typed.Issues, issue => issue.Reason == "source_coverage_not_complete");
    }

    [Fact]
    public async Task A_cycle_or_an_unbound_stage_dependency_is_invalid()
    {
        var f = new Fixture();
        foreach (var dependencies in new[] { new[] { "model-stage" }, new[] { "unknown-stage" } })
        {
            var invalid = f.Descriptor with
            {
                Stages = [f.Descriptor.Stages[0] with { Dependencies = dependencies }, f.Descriptor.Stages[1]],
            };
            Assert.Equal(HistoricalReplayReadiness.Rejected,
                (await f.Service.AssessAsync(f.Trust, invalid, HistoricalReplayMode.Reconstruction)).Status);
        }
        Assert.Empty(f.Reader.Calls);
    }

    [Fact]
    public async Task Legacy_history_stays_readable_but_is_not_exact_replay_ready()
    {
        var f = new Fixture();
        var legacy = await f.Service.AssessAsync(new(f.Source, null), null, HistoricalReplayMode.RecordedTyped);
        var missing = await f.Service.AssessAsync(f.Trust, null, HistoricalReplayMode.RecordedTyped);

        Assert.Equal(HistoricalReplayReadiness.LegacyDescriptorUnavailable, legacy.Status);
        Assert.Equal(HistoricalReplayReadiness.Unavailable, missing.Status);
        Assert.Empty(f.Reader.Calls);
        Assert.Equal(f.Source, f.ResolveExistingAnchor());
    }

    [Fact]
    public async Task An_evicted_optional_checkpoint_does_not_change_readiness_but_a_required_one_does()
    {
        var f = new Fixture();
        f.Reader.Resolve = id => id.ArtifactId == "optional-cache" ? null : Fixture.Read(id);
        var optional = await f.RunAsync(HistoricalReplayMode.RecordedTyped);
        Assert.Equal(HistoricalReplayReadiness.Ready, optional.Status);
        Assert.Equal(HistoricalArtifactAvailability.NotChecked, Find(optional, "optional-cache").ObservedAvailability);

        var required = f.WithArtifact("optional-cache", row => row with { AdditionalRequirements = HistoricalRequiredModes.RecordedTyped });
        var afterEviction = await f.RunAsync(HistoricalReplayMode.RecordedTyped, required);
        Assert.Equal(HistoricalReplayReadiness.Partial, afterEviction.Status);
        Assert.Equal(HistoricalArtifactAvailability.Missing, Find(afterEviction, "optional-cache").ObservedAvailability);
    }

    [Fact]
    public async Task Cancellation_propagates_to_the_artifact_adapter_and_does_not_return_a_partial_receipt()
    {
        var f = new Fixture();
        using CancellationTokenSource source = new();
        f.Reader.Resolve = _ =>
        {
            source.Cancel();
            return null;
        };

        await Assert.ThrowsAnyAsync<OperationCanceledException>(() => f.Service.AssessAsync(f.Trust, f.Descriptor,
            HistoricalReplayMode.Reconstruction, cancellationToken: source.Token));
        Assert.Equal(source.Token, f.Reader.Token);
        Assert.Single(f.Reader.Calls);
    }

    [Fact]
    public void Reordering_cannot_change_the_descriptor_pin_but_historical_attempt_metadata_can()
    {
        var f = new Fixture();
        var shuffled = f.Descriptor with { Artifacts = f.Descriptor.Artifacts.Reverse().ToArray(), Stages = f.Descriptor.Stages.Reverse().ToArray() };
        var change = f.Descriptor with { Stages = [f.Descriptor.Stages[0], f.Descriptor.Stages[1] with
        {
            AcceptedAttempt = f.Descriptor.Stages[1].AcceptedAttempt! with { ModelVersion = "another-version" },
        }] };
        Assert.Equal(f.Digest, HistoricalReplayCompletenessService.DescriptorSha256(shuffled));
        Assert.NotEqual(f.Digest, HistoricalReplayCompletenessService.DescriptorSha256(change));
    }

    [Fact]
    public void Trace_adapter_only_projects_the_selected_accepted_attempt_and_no_prompt_or_response_bytes()
    {
        var f = new Fixture();
        AgentExecutionTrace trace = new()
        {
            TraceId = "selected-trace", RunId = f.Source.Run.RunId.ToString("D"), TaskId = "task", AttemptIndex = 1,
            ParseSucceeded = true, ParsedResultJson = "private-result", SystemPrompt = "private-prompt", RawResponse = "private-response",
            ModelVersion = "historic-model", ModelDeploymentName = "retired-deployment", CompletionTemperature = 0.25f, QualityWarning = true,
        };
        var projected = Assert.IsType<HistoricalAcceptedAttempt>(HistoricalReplaySourceAnchors.TryBindAcceptedTrace(
            f.Source.Run, "task", "selected-trace", 1, trace, "historical-provider"));
        Assert.Equal(1, projected.RecordedAttemptIndex);
        Assert.Equal("historic-model", projected.ModelVersion);
        Assert.Equal(HistoricalAttemptDisposition.AcceptedWithWarning, projected.ValidationDisposition);
        Assert.NotNull(projected.ParametersSha256);
        Assert.DoesNotContain("private-", JsonSerializer.Serialize(projected), StringComparison.Ordinal);
        Assert.Null(HistoricalReplaySourceAnchors.TryBindAcceptedTrace(f.Source.Run, "task", "selected-trace", 0, trace));
        trace.QualityRejected = true;
        Assert.Null(HistoricalReplaySourceAnchors.TryBindAcceptedTrace(f.Source.Run, "task", "selected-trace", 1, trace));
    }

    [Fact]
    public async Task Authority_archives_read_only_the_pinned_artifact_and_never_fall_back_to_raw_trace_content()
    {
        var f = new Fixture();
        var repo = new Mock<IArtifactBundleRepository>(MockBehavior.Strict);
        Guid artifact = Guid.NewGuid();
        var archived = new SynthesizedArtifact
        {
            RunId = f.Source.Run.RunId, ManifestId = f.Source.SourceRecordId, ArtifactId = artifact, Content = "sealed entry",
        };
        repo.Setup(port => port.GetArtifactByIdAsync(It.Is<ScopeContext>(scope =>
                f.Source.Run.Scope.Matches(scope.TenantId, scope.WorkspaceId, scope.ProjectId)),
            f.Source.SourceRecordId, artifact, CancellationToken.None)).ReturnsAsync(archived);
        var reader = new AuthorityBundleHistoricalArtifactReader(repo.Object, f.Source);
        HistoricalArtifactIdentity id = new(f.Source.Run, artifact.ToString("D"), HistoricalArtifactRole.OriginalOutput,
            AuthorityBundleHistoricalArtifactReader.ArchiveSchema, null, null);

        var notRaw = await reader.OpenReadAsync(id with { Role = HistoricalArtifactRole.AcceptedRawResponse }, CancellationToken.None);
        Assert.Equal(HistoricalArtifactAvailability.Incompatible, notRaw!.Availability);
        repo.VerifyNoOtherCalls();

        var retained = await reader.OpenReadAsync(id, CancellationToken.None);
        Assert.Equal(HistoricalArtifactAvailability.Exact, retained!.Availability);
        await using var stream = retained.Content!;
        using var content = new StreamReader(stream);
        Assert.Equal(archived.Content, await content.ReadToEndAsync(CancellationToken.None));
        repo.Verify(port => port.GetArtifactByIdAsync(It.IsAny<ScopeContext>(), f.Source.SourceRecordId, artifact,
            CancellationToken.None), Times.Once);
        repo.VerifyNoOtherCalls();
    }

    private static HistoricalArtifactCheck Find(HistoricalReplayAssessment result, string id) =>
        Assert.Single(result.Artifacts, row => row.ArtifactId == id);

    private sealed class Fixture
    {
        private static readonly DateTimeOffset AsOf = new(2026, 11, 24, 12, 0, 0, TimeSpan.Zero);
        private readonly RunDetailDto? existing;
        private readonly AzureInventorySnapshotRecord? snapshot;
        private readonly ManifestHashService hasher = new();
        private readonly HistoricalRunIdentity run;

        internal Fixture(HistoricalReplayProduct product = HistoricalReplayProduct.ArchLucid)
        {
            ProjectScopeKey scope = ProjectScopeKey.Create(Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid());
            Guid snapshotId = Guid.NewGuid();
            run = new(scope, product, Guid.NewGuid(), snapshotId, Guid.NewGuid());
            if (product == HistoricalReplayProduct.ArchLucid)
            {
                var original = new ManifestDocument
                {
                    ManifestId = Guid.NewGuid(), RunId = run.RunId, TenantId = scope.TenantId, WorkspaceId = scope.WorkspaceId,
                    ProjectId = scope.ProjectId, FindingsSnapshotId = snapshotId,
                    RuleSetId = "policy", RuleSetVersion = "v1", RuleSetHash = new string('A', 64),
                };
                original.ManifestHash = hasher.ComputeHash(original);
                existing = new()
                {
                    Run = new RunRecord
                    {
                        TenantId = scope.TenantId, WorkspaceId = scope.WorkspaceId, ScopeProjectId = scope.ProjectId,
                        RunId = run.RunId, GoldenManifestId = original.ManifestId, FindingsSnapshotId = snapshotId,
                        PinnedEvidencePackagePinsHashSha256 = SHA256.HashData(Bytes("stored-evidence-pin")),
                        PinnedPolicyPackIdsHashSha256 = SHA256.HashData(Bytes("stored-policy-pin")),
                    },
                    GoldenManifest = original,
                };
            }
            else
            {
                snapshot = new()
                {
                    SnapshotId = snapshotId, TenantId = scope.TenantId, WorkspaceId = scope.WorkspaceId, ProjectId = scope.ProjectId,
                    CaptureStatus = AzureInventoryCaptureStatus.Succeeded, CompletenessScore = 1m, CapturedUtc = AsOf.UtcDateTime,
                    ContentHashSha256 = SHA256.HashData(Bytes("inventory-identity")),
                };
            }
            Source = Assert.IsType<HistoricalSourceAnchor>(ResolveExistingAnchor());
            Descriptor = new(HistoricalReplayCompletenessService.DescriptorVersion, Source, AsOf, HistoricalCoverage.Complete,
                new("historic-build", "runtime-v1", "dependencies-v1", "config-v1", "output-v1", "canonical-v1"),
                [new("input-stage", HistoricalStageKind.Deterministic, HistoricalCoverage.Complete, AsOf, [], null),
                 new("model-stage", HistoricalStageKind.Model, HistoricalCoverage.Complete, AsOf, ["input-stage"],
                     new("accepted-attempt", "prompt-template", "v1", "provider", "archived-deployment",
                         Convert.ToHexString(SHA256.HashData(Bytes("old-parameters"))), HistoricalAttemptDisposition.Accepted))],
                [Pin("manifest", HistoricalArtifactRole.OriginalOutput), Pin("evidence", HistoricalArtifactRole.SourceEvidence),
                 Pin("policy", HistoricalArtifactRole.EffectivePolicy), Pin("trace", HistoricalArtifactRole.DecisionTrace),
                 Pin("config", HistoricalArtifactRole.Configuration), Pin("executable", HistoricalArtifactRole.Executable),
                 Pin("runtime", HistoricalArtifactRole.RuntimeDependencies), Pin("input-output", HistoricalArtifactRole.StageOutput, "input-stage"),
                 Pin("model-output", HistoricalArtifactRole.StageOutput, "model-stage"),
                 Pin("typed", HistoricalArtifactRole.AcceptedTypedInput, "model-stage", "accepted-attempt"),
                 Pin("response", HistoricalArtifactRole.AcceptedRawResponse, "model-stage", "accepted-attempt"),
                 Pin("prompt", HistoricalArtifactRole.AcceptedPrompt, "model-stage", "accepted-attempt"),
                 Pin("optional-cache", HistoricalArtifactRole.Checkpoint, "input-stage")]);
            Service = new(Reader);
        }

        internal HistoricalSourceAnchor Source { get; }
        internal HistoricalReplayDescriptor Descriptor { get; }
        internal string Digest => HistoricalReplayCompletenessService.DescriptorSha256(Descriptor);
        internal HistoricalReplayTrust Trust => new(Source, Digest);
        internal StubReader Reader { get; } = new();
        internal HistoricalReplayCompletenessService Service { get; }

        internal HistoricalSourceAnchor? ResolveExistingAnchor() => existing is { } stored
            ? HistoricalReplaySourceAnchors.TryBindAuthority(run, stored, hasher)
            : HistoricalReplaySourceAnchors.TryBindSecureNow(run, snapshot!);

        internal HistoricalReplayDescriptor WithArtifact(string id, Func<HistoricalArtifactPin, HistoricalArtifactPin> map) =>
            Descriptor with { Artifacts = Descriptor.Artifacts.Select(row => row.ArtifactId == id ? map(row) : row).ToArray() };

        internal Task<HistoricalReplayAssessment> RunAsync(HistoricalReplayMode mode = HistoricalReplayMode.Reconstruction,
            HistoricalReplayDescriptor? raw = null)
        {
            raw ??= Descriptor;
            return Service.AssessAsync(new(Source, HistoricalReplayCompletenessService.DescriptorSha256(raw)), raw, mode, Descriptor.Versions);
        }

        internal static byte[] Bytes(string id) => Encoding.UTF8.GetBytes(id);
        internal static HistoricalArtifactRead Read(HistoricalArtifactIdentity identity) =>
            new(identity, HistoricalArtifactAvailability.Exact, new MemoryStream(Bytes(identity.ArtifactId)));

        private static HistoricalArtifactPin Pin(string id, HistoricalArtifactRole role, string? stage = null, string? attempt = null) =>
            new(id, role, "schema-v1", stage, attempt, Convert.ToHexString(SHA256.HashData(Bytes(id))), Bytes(id).Length,
                AsOf, HistoricalArtifactAvailability.Exact, HistoricalRequiredModes.None);
    }

    private sealed class StubReader : IScopedHistoricalArtifactReader
    {
        internal List<HistoricalArtifactIdentity> Calls { get; } = [];
        internal CancellationToken Token { get; private set; }
        internal Func<HistoricalArtifactIdentity, HistoricalArtifactRead?> Resolve { get; set; } = Fixture.Read;

        public ValueTask<HistoricalArtifactRead?> OpenReadAsync(HistoricalArtifactIdentity identity, CancellationToken cancellationToken)
        {
            Calls.Add(identity);
            Token = cancellationToken;
            return ValueTask.FromResult(Resolve(identity));
        }
    }

    private sealed class ObservedStream(byte[] bytes) : MemoryStream(bytes)
    {
        internal int BytesRead { get; private set; }
        internal bool Disposed { get; private set; }

        public override ValueTask<int> ReadAsync(Memory<byte> buffer, CancellationToken cancellationToken = default)
        {
            cancellationToken.ThrowIfCancellationRequested();
            int count = Read(buffer.Span);
            BytesRead += count;
            return ValueTask.FromResult(count);
        }

        protected override void Dispose(bool disposing)
        {
            Disposed = true;
            base.Dispose(disposing);
        }
    }
}
