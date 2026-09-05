using ArchLucid.Application.Drafts;
using ArchLucid.Application.Exports;
using ArchLucid.Application.Runs.Finalization;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Drafts;
using ArchLucid.Contracts.Exports;
using ArchLucid.Contracts.Manifest;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Core.Manifest;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Feasibility;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Decisioning.Services;
using ArchLucid.Persistence.Models;
using ArchLucid.Persistence.Queries;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.Exports;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class DecisionReceiptServiceTests
{
    private static readonly ScopeContext Scope = new()
    {
        TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
        WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
        ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
    };

    private static readonly Guid DraftId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");
    private static readonly Guid RunId = Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee");
    private static readonly Guid ManifestId = Guid.Parse("ffffffff-ffff-ffff-ffff-ffffffffffff");

    private readonly Mock<IDraftRequestService> _drafts = new();
    private readonly Mock<IAuthorityQueryService> _authority = new();
    private readonly Mock<IRunDetailQueryService> _runDetails = new();
    private readonly ManifestHashService _manifestHashService = new();
    private readonly FeasibilityVerdictBuilder _verdictBuilder = new(new FeasibilityVerdictValidator());

    [Fact]
    public async Task BuildForDraftAsync_RedirectedDraft_ReturnsReceipt()
    {
        _drafts
            .Setup(static s => s.GetAsync(It.IsAny<ScopeContext>(), It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new DraftRequestResponse
            {
                DraftId = DraftId,
                Status = DraftRequestStatus.Redirected,
                RedirectReason = "Business outcome required.",
                Document = new DraftRequestDocument
                {
                    FreeTextIntent = "Build a workflow.",
                    TransparencyTrail = new TransparencyTrail(),
                },
            });

        DecisionReceiptService sut = CreateSut();

        DecisionReceiptDocument? receipt = await sut.BuildForDraftAsync(Scope, DraftId, CancellationToken.None);

        receipt.Should().NotBeNull();
        receipt!.Source.Should().Be(DecisionReceiptSource.DraftAdmission);
        receipt!.Verdict.Kind.Should().Be(FeasibilityVerdictKind.SoftInfeasible);
    }

    [Fact]
    public async Task BuildForDraftAsync_AdmittedDraft_ReturnsNull()
    {
        _drafts
            .Setup(static s => s.GetAsync(It.IsAny<ScopeContext>(), It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new DraftRequestResponse
            {
                DraftId = DraftId,
                Status = DraftRequestStatus.Admitted,
                Document = new DraftRequestDocument(),
            });

        DecisionReceiptService sut = CreateSut();

        DecisionReceiptDocument? receipt = await sut.BuildForDraftAsync(Scope, DraftId, CancellationToken.None);

        receipt.Should().BeNull();
    }

    [Fact]
    public async Task BuildForRunAsync_FeasibleManifest_ReturnsReceiptMatchingSealedHash()
    {
        SetupCommittedRunDetail();
        FeasibilityVerdict verdict = CreateFeasibleVerdict();
        SetupVerifiedCommittedManifest(verdict, out string sealedReceiptHash);

        DecisionReceiptService sut = CreateSut();

        DecisionReceiptRunBuildResult buildResult = await sut.BuildForRunAsync(Scope, RunId, CancellationToken.None);

        buildResult.Outcome.Should().Be(DecisionReceiptRunBuildOutcome.Success);
        buildResult.Receipt.Should().NotBeNull();
        buildResult.Receipt!.RunId.Should().Be(RunId);
        buildResult.Receipt.Source.Should().Be(DecisionReceiptSource.CommittedRun);
        buildResult.Receipt.Verdict.Kind.Should().Be(FeasibilityVerdictKind.Feasible);
        buildResult.Receipt.ReceiptHashSha256.Should().Be(sealedReceiptHash);
    }

    [Fact]
    public async Task BuildForRunAsync_InfeasibleManifest_ReturnsReceiptMatchingSealedHash()
    {
        SetupCommittedRunDetail();
        FeasibilityVerdict verdict = CreateInfeasibleVerdict();
        SetupVerifiedCommittedManifest(verdict, out string sealedReceiptHash);

        DecisionReceiptService sut = CreateSut();

        DecisionReceiptRunBuildResult buildResult = await sut.BuildForRunAsync(Scope, RunId, CancellationToken.None);

        buildResult.Outcome.Should().Be(DecisionReceiptRunBuildOutcome.Success);
        buildResult.Receipt.Should().NotBeNull();
        buildResult.Receipt!.RunId.Should().Be(RunId);
        buildResult.Receipt.Source.Should().Be(DecisionReceiptSource.CommittedRun);
        buildResult.Receipt.ReceiptHashSha256.Should().Be(sealedReceiptHash);
    }

    [Fact]
    public async Task BuildForRunAsync_MissingFeasibilityVerdict_ReturnsSealedReceiptIncomplete()
    {
        SetupCommittedRunDetail();
        SetupVerifiedCommittedManifest(CreateFeasibleVerdict(), out _);

        _authority
            .Setup(static s => s.GetRunDetailForManifestCompareAsync(It.IsAny<ScopeContext>(), It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((ScopeContext _, Guid runId, CancellationToken _) =>
            {
                ManifestDocument manifest = CreateCommittedManifest(runId, CreateFeasibleVerdict());
                manifest.FeasibilityVerdict = null;

                return new RunDetailDto
                {
                    Run = new RunRecord { RunId = runId },
                    GoldenManifest = manifest,
                };
            });

        DecisionReceiptService sut = CreateSut();

        DecisionReceiptRunBuildResult buildResult = await sut.BuildForRunAsync(Scope, RunId, CancellationToken.None);

        buildResult.Outcome.Should().Be(DecisionReceiptRunBuildOutcome.SealedReceiptIncomplete);
        buildResult.Receipt.Should().BeNull();
    }

    [Fact]
    public async Task BuildForRunAsync_SealedReceiptHashMismatch_ReturnsSealedHashMismatch()
    {
        SetupCommittedRunDetail();
        SetupVerifiedCommittedManifest(CreateFeasibleVerdict(), out _);

        _authority
            .Setup(static s => s.GetRunDetailForManifestCompareAsync(It.IsAny<ScopeContext>(), It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((ScopeContext _, Guid runId, CancellationToken _) =>
            {
                ManifestDocument manifest = CreateCommittedManifest(runId, CreateFeasibleVerdict());
                manifest.CommittedDecisionReceiptHashSha256 = new string('A', 64);

                return new RunDetailDto
                {
                    Run = new RunRecord { RunId = runId },
                    GoldenManifest = manifest,
                };
            });

        DecisionReceiptService sut = CreateSut();

        DecisionReceiptRunBuildResult buildResult = await sut.BuildForRunAsync(Scope, RunId, CancellationToken.None);

        buildResult.Outcome.Should().Be(DecisionReceiptRunBuildOutcome.SealedHashMismatch);
        buildResult.Receipt.Should().BeNull();
    }

    [Fact]
    public async Task BuildForRunAsync_UncommittedRunWithManifestPointer_ReturnsNotFound()
    {
        ArchitectureRunDetail detail = new()
        {
            Run = new ArchitectureRun
            {
                RunId = RunId.ToString("N"),
                Status = ArchitectureRunStatus.ReadyForCommit,
            },
            Manifest = null,
        };

        _runDetails
            .Setup(static s => s.GetRunDetailAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(detail);

        _authority
            .Setup(static s => s.GetRunSummaryAsync(It.IsAny<ScopeContext>(), It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RunSummaryDto
            {
                RunId = RunId,
                GoldenManifestId = ManifestId,
            });

        SetupVerifiedCommittedManifest(CreateInfeasibleVerdict(), out _);

        DecisionReceiptService sut = CreateSut();

        DecisionReceiptRunBuildResult buildResult = await sut.BuildForRunAsync(Scope, RunId, CancellationToken.None);

        buildResult.Outcome.Should().Be(DecisionReceiptRunBuildOutcome.NotFound);
        _authority.Verify(
            static s => s.GetRunDetailForManifestCompareAsync(It.IsAny<ScopeContext>(), It.IsAny<Guid>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task BuildForRunAsync_BrokenManifestReference_ReturnsNotFound()
    {
        ArchitectureRunDetail detail = new()
        {
            Run = new ArchitectureRun
            {
                RunId = RunId.ToString("N"),
                Status = ArchitectureRunStatus.Committed,
                CurrentManifestVersion = "v-missing",
            },
            Manifest = null,
            HasBrokenManifestReference = true,
        };

        _runDetails
            .Setup(static s => s.GetRunDetailAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(detail);

        _authority
            .Setup(static s => s.GetRunSummaryAsync(It.IsAny<ScopeContext>(), It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RunSummaryDto
            {
                RunId = RunId,
                GoldenManifestId = ManifestId,
            });

        SetupVerifiedCommittedManifest(CreateInfeasibleVerdict(), out _);

        DecisionReceiptService sut = CreateSut();

        DecisionReceiptRunBuildResult buildResult = await sut.BuildForRunAsync(Scope, RunId, CancellationToken.None);

        buildResult.Outcome.Should().Be(DecisionReceiptRunBuildOutcome.NotFound);
        _authority.Verify(
            static s => s.GetRunDetailForManifestCompareAsync(It.IsAny<ScopeContext>(), It.IsAny<Guid>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task BuildForRunAsync_UsesSealedManifestVerdictAndVersion()
    {
        SetupCommittedRunDetail();
        FeasibilityVerdict sealedVerdict = CreateInfeasibleVerdict();
        SetupVerifiedCommittedManifest(sealedVerdict, out _);

        DecisionReceiptService sut = CreateSut();

        DecisionReceiptRunBuildResult buildResult = await sut.BuildForRunAsync(Scope, RunId, CancellationToken.None);

        buildResult.Outcome.Should().Be(DecisionReceiptRunBuildOutcome.Success);
        buildResult.Receipt!.Verdict.Kind.Should().Be(FeasibilityVerdictKind.SoftInfeasible);
        buildResult.Receipt.ManifestVersion.Should().Be("v1");
        _authority.Verify(
            static s => s.GetManifestSummaryAsync(It.IsAny<ScopeContext>(), It.IsAny<Guid>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    private void SetupCommittedRunDetail()
    {
        ArchitectureRunDetail detail = new()
        {
            Run = new ArchitectureRun
            {
                RunId = RunId.ToString("N"),
                Status = ArchitectureRunStatus.Committed,
                CurrentManifestVersion = "v1",
            },
            AuthorityLifecyclePhase = AuthorityRunLifecyclePhase.Complete,
            Manifest = new GoldenManifest
            {
                RunId = RunId.ToString("N"),
                SystemName = "Contoso",
                Services = [],
                Datastores = [],
                Relationships = [],
                Governance = new ManifestGovernance(),
                Metadata = new ArchLucid.Contracts.Manifest.ManifestMetadata { ManifestVersion = "v1", CreatedUtc = DateTime.UtcNow },
            },
        };

        _runDetails
            .Setup(static s => s.GetRunDetailAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(detail);
    }

    private void SetupVerifiedCommittedManifest(FeasibilityVerdict verdict, out string sealedReceiptHash)
    {
        ManifestDocument manifest = CreateCommittedManifest(RunId, verdict);
        string hashBeforeReceipt = ManifestDecisionReceiptExportBinder.ComputeHashBeforeReceipt(manifest, _manifestHashService);
        DecisionReceiptDocument sealedReceipt = DecisionReceiptComposer.BuildForRun(
            RunId,
            verdict,
            hashBeforeReceipt,
            "v1");
        manifest.CommittedDecisionReceiptHashSha256 = sealedReceipt.ReceiptHashSha256;
        sealedReceiptHash = sealedReceipt.ReceiptHashSha256!;

        _authority
            .Setup(static s => s.GetRunSummaryAsync(It.IsAny<ScopeContext>(), It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RunSummaryDto
            {
                RunId = RunId,
                GoldenManifestId = ManifestId,
            });

        _authority
            .Setup(static s => s.GetRunDetailForManifestCompareAsync(It.IsAny<ScopeContext>(), It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RunDetailDto
            {
                Run = new RunRecord { RunId = RunId },
                GoldenManifest = manifest,
            });
    }

    private ManifestDocument CreateCommittedManifest(Guid runId, FeasibilityVerdict verdict)
    {
        return new ManifestDocument
        {
            ManifestId = ManifestId,
            RunId = runId,
            TenantId = Scope.TenantId,
            WorkspaceId = Scope.WorkspaceId,
            ProjectId = Scope.ProjectId,
            RuleSetId = "default",
            RuleSetVersion = "1",
            RuleSetHash = "hash",
            ManifestHash = "ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789",
            Metadata = new Core.Manifest.Sections.ManifestMetadata { Version = "v1" },
            FeasibilityVerdict = verdict,
        };
    }

    private static FeasibilityVerdict CreateFeasibleVerdict() =>
        new()
        {
            Kind = FeasibilityVerdictKind.Feasible,
            Summary = "Architecture satisfies policy controls.",
            TransparencyTrail = new TransparencyTrail(),
        };

    private static FeasibilityVerdict CreateInfeasibleVerdict() =>
        new()
        {
            Kind = FeasibilityVerdictKind.SoftInfeasible,
            Summary = "Policy controls are not satisfied.",
            TransparencyTrail = new TransparencyTrail(),
            SoftEnvelope = new SoftInfeasibilityEnvelope
            {
                ConfidenceLow = 50,
                ConfidenceHigh = 80,
                EnvelopeDescription = "Holds for this manifest snapshot.",
                SoftAssumption = "Operator intent matches asserted inputs.",
                CostOfBeingWrong = "Shipping policy gaps to production.",
            },
        };

    private DecisionReceiptService CreateSut() =>
        new(_drafts.Object, _authority.Object, _runDetails.Object, _manifestHashService, _verdictBuilder);
}
