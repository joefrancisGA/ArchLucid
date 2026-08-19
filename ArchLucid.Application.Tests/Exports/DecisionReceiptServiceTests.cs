using ArchLucid.Application.Drafts;
using ArchLucid.Application.Exports;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Drafts;
using ArchLucid.Contracts.Exports;
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

        DecisionReceiptService sut = new(_drafts.Object, _authority.Object, _verdictBuilder);

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

        DecisionReceiptService sut = new(_drafts.Object, _authority.Object, _verdictBuilder);

        DecisionReceiptDocument? receipt = await sut.BuildForDraftAsync(Scope, DraftId, CancellationToken.None);

        receipt.Should().BeNull();
    }

    [Fact]
    public async Task BuildForRunAsync_InfeasibleManifest_ReturnsReceipt()
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

        DecisionReceiptService sut = new(_drafts.Object, _authority.Object, _verdictBuilder);

        DecisionReceiptDocument? receipt = await sut.BuildForRunAsync(Scope, RunId, CancellationToken.None);

        receipt.Should().NotBeNull();
        receipt!.RunId.Should().Be(RunId);
        receipt.Source.Should().Be(DecisionReceiptSource.CommittedRun);
    }
}
