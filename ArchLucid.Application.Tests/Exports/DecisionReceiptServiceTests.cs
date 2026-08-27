using ArchLucid.Application.Drafts;
using ArchLucid.Application.Exports;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Drafts;
using ArchLucid.Contracts.Exports;
using ArchLucid.Contracts.Manifest;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Feasibility;
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
    public async Task BuildForRunAsync_InfeasibleManifest_ReturnsReceipt()
    {
        SetupCommittedRunDetail();
        SetupInfeasibleManifestSummary();

        DecisionReceiptService sut = CreateSut();

        DecisionReceiptDocument? receipt = await sut.BuildForRunAsync(Scope, RunId, CancellationToken.None);

        receipt.Should().NotBeNull();
        receipt!.RunId.Should().Be(RunId);
        receipt.Source.Should().Be(DecisionReceiptSource.CommittedRun);
    }

    [Fact]
    public async Task BuildForRunAsync_UncommittedRunWithManifestPointer_ReturnsNull()
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

        SetupInfeasibleManifestSummary();

        DecisionReceiptService sut = CreateSut();

        DecisionReceiptDocument? receipt = await sut.BuildForRunAsync(Scope, RunId, CancellationToken.None);

        receipt.Should().BeNull();
        _authority.Verify(
            static s => s.GetManifestSummaryAsync(It.IsAny<ScopeContext>(), It.IsAny<Guid>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task BuildForRunAsync_BrokenManifestReference_ReturnsNull()
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

        SetupInfeasibleManifestSummary();

        DecisionReceiptService sut = CreateSut();

        DecisionReceiptDocument? receipt = await sut.BuildForRunAsync(Scope, RunId, CancellationToken.None);

        receipt.Should().BeNull();
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
            Manifest = new GoldenManifest
            {
                RunId = RunId.ToString("N"),
                SystemName = "Contoso",
                Services = [],
                Datastores = [],
                Relationships = [],
                Governance = new ManifestGovernance(),
                Metadata = new ManifestMetadata { ManifestVersion = "v1", CreatedUtc = DateTime.UtcNow },
            },
        };

        _runDetails
            .Setup(static s => s.GetRunDetailAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(detail);
    }

    private void SetupInfeasibleManifestSummary()
    {
        _authority
            .Setup(static s => s.GetRunSummaryAsync(It.IsAny<ScopeContext>(), It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RunSummaryDto
            {
                RunId = RunId,
                GoldenManifestId = ManifestId,
            });

        _authority
            .Setup(static s => s.GetManifestSummaryAsync(It.IsAny<ScopeContext>(), It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ManifestSummaryDto
            {
                ManifestId = ManifestId,
                RunId = RunId,
                FeasibilityVerdict = new FeasibilityVerdict
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
                },
            });
    }

    private DecisionReceiptService CreateSut() =>
        new(_drafts.Object, _authority.Object, _runDetails.Object, _verdictBuilder);
}
