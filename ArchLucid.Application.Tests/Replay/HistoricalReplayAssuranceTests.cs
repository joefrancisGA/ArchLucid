using System.Diagnostics;
using System.Security.Cryptography;
using System.Text.Json;
using System.Text.Json.Nodes;

using ArchLucid.Application.Replay.Historical;
using ArchLucid.Application.Replay.Historical.Assurance;
using ArchLucid.Application.Replay.Historical.Execution;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Scoping;

using Moq;

using static ArchLucid.Application.Replay.Historical.Execution.RecordedReplayRecipe;

namespace ArchLucid.Application.Tests.Replay;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class HistoricalReplayAssuranceTests
{
    [SkippableTheory]
    [InlineData(HistoricalReplayProduct.ArchLucid, HistoricalClaimVerdict.Supported)]
    [InlineData(HistoricalReplayProduct.ArchLucid, HistoricalClaimVerdict.Refuted)]
    [InlineData(HistoricalReplayProduct.ArchLucid, HistoricalClaimVerdict.Indeterminate)]
    [InlineData(HistoricalReplayProduct.SecureNow, HistoricalClaimVerdict.Supported)]
    [InlineData(HistoricalReplayProduct.SecureNow, HistoricalClaimVerdict.Refuted)]
    [InlineData(HistoricalReplayProduct.SecureNow, HistoricalClaimVerdict.Indeterminate)]
    public async Task Independent_corpus_can_refute_a_finding_even_when_the_isolated_worker_matches_it(
        HistoricalReplayProduct product, HistoricalClaimVerdict expected)
    {
        string? image = Environment.GetEnvironmentVariable("FND095_TEST_IMAGE");
        string? dll = Environment.GetEnvironmentVariable("FND095_TEST_WORKER_DLL");
        Skip.If(image is null && dll is null, "Requires the focused worker verification lane or a local network namespace.");
        var f = Case(product, expected, image);
        var original = Hashes(f);
        IRecordedReplayWorker worker = image is not null ? new IsolatedRecordedReplayWorker()
            : new RecordedReplayWorkerIntegrationTests.NamespaceWorker(dll!);
        var watch = Stopwatch.StartNew();
        using var deadline = new CancellationTokenSource(TimeSpan.FromSeconds(45));
        var report = await Review(f, includeReplay: true, worker: worker, ct: deadline.Token);

        Assert.Equal(HistoricalReplayReadiness.Ready, report.Reconstruction!.Status);
        Assert.Equal(RecordedReplayOutcome.ReproducedWithinScope, report.Reproduction!.Outcome);
        Assert.Equal(expected, report.IndependentReview!.Verdict);
        Assert.Null(report.Drift);
        Assert.Equal(original, Hashes(f));
        Assert.Equal(report.Reproduction.AuditId, ReadReplayAuditId(f));
        AssertReportAudit(f, report);

        var root = Environment.GetEnvironmentVariable("FND097_ASSURANCE_EVIDENCE_DIR");
        if (!string.IsNullOrWhiteSpace(root))
        {
            Directory.CreateDirectory(root);
            await File.WriteAllTextAsync(Path.Combine(root, $"{product}-{expected}.json"),
                JsonSerializer.Serialize(new
                {
                    product = product.ToString(), reconstruction = report.Reconstruction.Status.ToString(),
                    reproduction = report.Reproduction.Outcome.ToString(), verdict = report.IndependentReview.Verdict.ToString(),
                    elapsedMilliseconds = watch.Elapsed.TotalMilliseconds, image,
                }), deadline.Token);
        }
    }

    [Fact]
    public async Task Valid_reconstruction_and_supported_claim_are_independent_of_an_unavailable_historical_package()
    {
        var f = Case(HistoricalReplayProduct.ArchLucid, HistoricalClaimVerdict.Supported);
        var current = f.Approval with
        {
            Versions = f.Approval.Versions with { EngineBuild = "current-engine", ConfigurationVersion = "current-config" },
        };
        f.Clock.Advance(TimeSpan.FromMinutes(15));
        var report = await Review(f, includeReplay: true, approval: current);
        Assert.Equal(HistoricalReplayReadiness.Ready, report.Reconstruction!.Status);
        Assert.Equal(RecordedReplayOutcome.Unavailable, report.Reproduction!.Outcome);
        Assert.Equal(HistoricalClaimVerdict.Supported, report.IndependentReview!.Verdict);
        Assert.Null(f.Input);
        AssertReportAudit(f, report);
    }

    [Fact]
    public async Task Wrong_attempt_blocks_reproduction_without_overriding_an_independently_supported_claim()
    {
        var f = new RecordedHistoricalReplayTests.Fixture(HistoricalReplayProduct.ArchLucid, HistoricalReplayMode.RecordedRaw,
            reviewClaim: true);
        f.AddObservations("enabled");
        f.Observe = id => id.ArtifactId == "raw" ? f.Read(id) with { Identity = id with { AttemptId = "unselected-attempt" } } : f.Read(id);
        var report = await Review(f, includeReplay: true);
        Assert.Equal(HistoricalReplayReadiness.Ready, report.Reconstruction!.Status);
        Assert.Equal(RecordedReplayOutcome.Partial, report.Reproduction!.Outcome);
        Assert.Equal(HistoricalClaimVerdict.Supported, report.IndependentReview!.Verdict);
        Assert.Null(f.Input);
    }

    [Fact]
    public async Task Revocation_during_durable_report_prevents_receipt_release_but_does_not_rewrite_audit()
    {
        var f = Case(HistoricalReplayProduct.ArchLucid, HistoricalClaimVerdict.Supported);
        var authority = new Mock<IHistoricalAssuranceAuthority>(MockBehavior.Strict);
        bool authorized = true;
        authority.Setup(port => port.IsAuthorizedAsync(f.ReconstructionGrant, f.Trust.DescriptorSha256!, 0,
            It.IsAny<CancellationToken>())).ReturnsAsync(() => authorized);
        f.OnAudit = evt =>
        {
            if (evt.EventType == AuditEventTypes.HistoricalIndependentAssuranceCompleted)
                authorized = false;
        };

        var before = Hashes(f);
        var report = await f.Assurance(reviewAuthority: authority.Object).AssessAsync(f.Trust, f.Descriptor,
            f.ReconstructionGrant, f.GovernedReader(f.ReconstructionGrant), 0);
        Assert.Null(report.AuditId);
        Assert.Null(report.IndependentReview);
        Assert.Equal("assurance_access_changed_after_audit", report.Reason);
        Assert.Single(f.Logged, evt => evt.EventType == AuditEventTypes.HistoricalIndependentAssuranceCompleted);
        Assert.Equal(before, Hashes(f));
    }

    [Fact]
    public async Task Material_drift_reports_the_first_changed_stage_and_its_dependents_without_changing_the_verdict()
    {
        var f = new RecordedHistoricalReplayTests.Fixture(HistoricalReplayProduct.ArchLucid, withTool: true, reviewClaim: true);
        f.AddObservations("enabled");
        f.OnExecute = _ =>
        {
            var stages = f.ExpectedOutput.Stages.ToDictionary();
            stages[ToolStage] = JsonSerializer.SerializeToElement(new { references = new[] { "changed-reference" } });
            stages[AuthorityStage] = JsonSerializer.SerializeToElement(new { missing = "security-relevant-evidence" });
            return new(stages, stages[AuthorityStage]);
        };
        var before = Hashes(f);
        var report = await Review(f, includeReplay: true);
        Assert.Equal(RecordedReplayOutcome.DriftDetected, report.Reproduction!.Outcome);
        Assert.Equal(ToolStage, report.Drift!.FirstDifference);
        Assert.Equal([AuthorityStage], report.Drift.DependentStages);
        Assert.True(report.Drift.FinalDiffers);
        Assert.Equal(HistoricalClaimVerdict.Supported, report.IndependentReview!.Verdict);
        Assert.Equal(before, Hashes(f));
    }

    [Theory]
    [InlineData("missing-trace")]
    [InlineData("tampered-observation")]
    [InlineData("wrong-scope-observation")]
    [InlineData("erased")]
    [InlineData("restore")]
    [InlineData("stale")]
    [InlineData("conflicting")]
    [InlineData("partially-covered")]
    public async Task Custody_fidelity_and_historical_time_are_not_substituted_by_replay(string variation)
    {
        var f = new RecordedHistoricalReplayTests.Fixture(HistoricalReplayProduct.ArchLucid, reviewClaim: true);
        f.AddObservations("enabled", coverage: variation != "partially-covered",
            observedAt: variation == "stale" ? f.Descriptor.RecordedUtc.AddHours(-1) : null);
        switch (variation)
        {
            case "missing-trace":
                f.Absent = "trace";
                f.Archive.Override = (_, _) => ValueTask.FromResult<HistoricalArtifactRead?>(null);
                break;
            case "tampered-observation": f.Observe = id => id.ArtifactId == "independent-observations"
                    ? new(id, HistoricalArtifactAvailability.Exact, new MemoryStream([.. f.Bytes[id.ArtifactId], 0])) : f.Read(id); break;
            case "wrong-scope-observation": f.Observe = id => id.ArtifactId == "independent-observations"
                    ? f.Read(id) with { Identity = id with { Run = new(ProjectScopeKey.Create(id.Run.TenantId, id.Run.WorkspaceId, Guid.NewGuid()),
                        id.Run.Product, id.Run.RunId, id.Run.SnapshotId, id.Run.FindingId) } } : f.Read(id); break;
            case "erased": f.CommittedErased = true; break;
            case "restore": f.Absent = "independent-observations"; break;
            case "conflicting":
                var json = JsonNode.Parse(f.Bytes["independent-observations"])!;
                var observations = json["observations"]!.AsArray();
                var other = observations[0]!.DeepClone();
                other["state"] = "disabled";
                observations.Add(other);
                f.Replace("independent-observations", JsonSerializer.SerializeToUtf8Bytes(json));
                break;
        }
        var before = Hashes(f);
        var report = await Review(f);
        Assert.Null(report.Reproduction);
        var expected = variation is "restore" or "missing-trace" ? HistoricalClaimVerdict.Supported : HistoricalClaimVerdict.Indeterminate;
        Assert.Equal(expected, report.IndependentReview!.Verdict);
        if (variation == "missing-trace")
            Assert.Equal(HistoricalReplayReadiness.Partial, report.Reconstruction!.Status);
        if (variation == "restore")
            Assert.Equal("independent-observations", Assert.Single(f.Archive.Calls).ArtifactId);
        Assert.Equal(before, Hashes(f));
        AssertReportAudit(f, report);
    }

    [Theory]
    [InlineData("project")]
    [InlineData("tenant")]
    [InlineData("denied")]
    [InlineData("revoked-during-read")]
    [InlineData("audit")]
    [InlineData("cancel")]
    public async Task Scoped_authority_cancellation_and_durable_report_are_boundaries(string variation)
    {
        var f = Case(HistoricalReplayProduct.ArchLucid, HistoricalClaimVerdict.Supported);
        var authority = new Mock<IHistoricalAssuranceAuthority>(MockBehavior.Strict);
        var authorized = variation != "denied";
        authority.Setup(port => port.IsAuthorizedAsync(f.ReconstructionGrant, f.Trust.DescriptorSha256!, 0,
            It.IsAny<CancellationToken>())).ReturnsAsync(() => authorized);
        using var cts = new CancellationTokenSource();
        switch (variation)
        {
            case "project": f.Ambient.ProjectId = Guid.NewGuid(); break;
            case "tenant": f.Ambient.TenantId = Guid.NewGuid(); break;
            case "revoked-during-read": f.OnAudit = evt =>
            {
                if (evt.EventType == AuditEventTypes.HistoricalReplayArtifactVerifiedForUse)
                    authorized = false;
            }; break;
            case "audit": f.OnAudit = evt =>
            {
                if (evt.EventType == AuditEventTypes.HistoricalIndependentAssuranceCompleted)
                    throw new IOException("test report audit failure");
            }; break;
            case "cancel": cts.Cancel(); break;
        }

        var review = () => f.Assurance(reviewAuthority: authority.Object).AssessAsync(f.Trust, f.Descriptor,
            f.ReconstructionGrant, f.GovernedReader(f.ReconstructionGrant), 0, cancellationToken: cts.Token);
        if (variation == "cancel")
            await Assert.ThrowsAnyAsync<OperationCanceledException>(review);
        else if (variation == "audit")
            await Assert.ThrowsAsync<DurableAuditWriteFailedException>(review);
        else
        {
            var report = await review();
            Assert.Null(report.Reconstruction);
            Assert.Null(report.IndependentReview);
            Assert.Null(report.AuditId);
        }
        if (variation is "project" or "tenant" or "denied" or "cancel")
            Assert.Empty(f.Primary.Calls);
        Assert.DoesNotContain(f.Logged, evt => evt.EventType == AuditEventTypes.HistoricalIndependentAssuranceCompleted);
    }

    [Fact]
    public async Task Descriptor_tampering_or_another_actors_reproduction_is_rejected_before_reads()
    {
        var f = Case(HistoricalReplayProduct.ArchLucid, HistoricalClaimVerdict.Supported);
        var assure = f.Assurance();
        var scoped = f.GovernedReader(f.ReconstructionGrant);
        var tampered = await assure.AssessAsync(f.Trust, f.Descriptor with { RecordedUtc = f.Descriptor.RecordedUtc.AddSeconds(1) },
            f.ReconstructionGrant, scoped, 0);
        Assert.Null(tampered.AuditId);
        var other = f.Grant with { ActorId = "other-actor" };
        var wrongActor = await assure.AssessAsync(f.Trust, f.Descriptor, f.ReconstructionGrant, scoped, 0,
            new(other, f.GovernedReader(other)));
        Assert.Null(wrongActor.AuditId);
        Assert.Empty(f.Primary.Calls);
    }

    [Fact]
    public async Task A_genuine_nonclaim_is_not_silently_reinterpreted_by_the_oracle()
    {
        var f = new RecordedHistoricalReplayTests.Fixture(HistoricalReplayProduct.ArchLucid);
        var report = await Review(f, includeReplay: true);
        Assert.Equal(RecordedReplayOutcome.ReproducedWithinScope, report.Reproduction!.Outcome);
        Assert.Equal(HistoricalClaimVerdict.Indeterminate, report.IndependentReview!.Verdict);
        Assert.Equal("unsupported_or_unbound_control_claim", report.IndependentReview.Reason);
    }

    private static RecordedHistoricalReplayTests.Fixture Case(HistoricalReplayProduct product, HistoricalClaimVerdict expected,
        string? image = null)
    {
        // These are independently authored observations. The actual replay worker is not used to create the expected verdict.
        var f = new RecordedHistoricalReplayTests.Fixture(product, image: image, reviewClaim: true, secureNowObservedSetting: expected switch
        {
            HistoricalClaimVerdict.Supported => "Enabled",
            HistoricalClaimVerdict.Refuted => "Disabled",
            _ => null,
        });
        if (product == HistoricalReplayProduct.ArchLucid && expected != HistoricalClaimVerdict.Indeterminate)
            f.AddObservations(expected == HistoricalClaimVerdict.Supported ? "enabled" : "disabled");
        return f;
    }

    private static Task<HistoricalReplayAssuranceReport> Review(RecordedHistoricalReplayTests.Fixture f, bool includeReplay = false,
        IRecordedReplayWorker? worker = null, RecordedReplayImage? approval = null, CancellationToken ct = default) =>
        f.Assurance(worker, approval: approval).AssessAsync(f.Trust, f.Descriptor, f.ReconstructionGrant,
            f.GovernedReader(f.ReconstructionGrant), 0, includeReplay ? new(f.Grant, f.GovernedReader()) : null, ct);

    private static Guid ReadReplayAuditId(RecordedHistoricalReplayTests.Fixture f) => Guid.Parse(Assert.Single(f.Logged,
        evt => evt.EventType == AuditEventTypes.HistoricalRecordedReplayCompleted).CorrelationId!);

    private static void AssertReportAudit(RecordedHistoricalReplayTests.Fixture f, HistoricalReplayAssuranceReport report)
    {
        var evt = Assert.Single(f.Logged, row => row.EventType == AuditEventTypes.HistoricalIndependentAssuranceCompleted);
        Assert.True(RequiredAuditEventTypes.IsRequired(evt.EventType));
        Assert.Equal(f.Grant.Run.ProjectId, evt.ProjectId);
        Assert.Equal(report.AuditId!.Value, Guid.Parse(evt.CorrelationId!));
        Assert.DoesNotContain(RecordedHistoricalReplayTests.Fixture.ControlClaim, evt.DataJson!, StringComparison.Ordinal);
        Assert.DoesNotContain("sample-resource", evt.DataJson!, StringComparison.Ordinal);
        using var json = JsonDocument.Parse(evt.DataJson!);
        Assert.Equal(report.IndependentReview!.Verdict.ToString(), json.RootElement.GetProperty("independentReview").GetString());
    }

    private static string[] Hashes(RecordedHistoricalReplayTests.Fixture f) => [.. f.Bytes.OrderBy(row => row.Key, StringComparer.Ordinal)
        .Select(row => row.Key + ":" + Convert.ToHexString(SHA256.HashData(row.Value))), HistoricalReplayCompletenessService.DescriptorSha256(f.Descriptor)];
}
