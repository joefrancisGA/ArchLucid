using ArchLucid.Application.Common;
using ArchLucid.Application.Exports;
using ArchLucid.Application.Roi;
using ArchLucid.Application.Value;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Pilots;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Pilots;

namespace ArchLucid.Application.Pilots;

/// <summary>
///     Default <see cref="IPilotsApplicationService"/> consolidating pilot route orchestration previously in
///     <c>PilotsController</c>.
/// </summary>
public sealed partial class PilotsApplicationService(
    FirstValueReportBuilder firstValueReportBuilder,
    ISponsorReviewPacketBuilder sponsorReviewPacketBuilder,
    FirstValueReportPdfBuilder firstValueReportPdfBuilder,
    PilotScorecardBuilder pilotScorecardBuilder,
    IPilotInProductScorecardService pilotInProductScorecardService,
    PilotOutcomeSummaryService pilotOutcomeSummaryService,
    RoiCostEvidenceCollectionResolver roiCostEvidenceCollectionResolver,
    IPilotReportCardService pilotReportCardService,
    SponsorOnePagerPdfBuilder sponsorOnePagerPdfBuilder,
    IWhyArchLucidSnapshotService whyArchLucidSnapshotService,
    ISponsorEvidencePackService sponsorEvidencePackService,
    IRunDetailQueryService runDetailQueryService,
    IPilotRunDeltaComputer pilotRunDeltaComputer,
    IRecentPilotRunDeltasService recentPilotRunDeltasService,
    IPilotCloseoutRepository pilotCloseoutRepository,
    IBuyerProofPackBuilder buyerProofPackBuilder,
    IAuditService auditService,
    ValueReportBuilder valueReportBuilder,
    IActorContext actorContext,
    IScopeContextProvider scopeContextProvider,
    IPilotBaselineRepository pilotBaselineRepository) : IPilotsApplicationService
{
    private readonly FirstValueReportBuilder _firstValueReportBuilder =
        firstValueReportBuilder ?? throw new ArgumentNullException(nameof(firstValueReportBuilder));

    private readonly ISponsorReviewPacketBuilder _sponsorReviewPacketBuilder =
        sponsorReviewPacketBuilder ?? throw new ArgumentNullException(nameof(sponsorReviewPacketBuilder));

    private readonly FirstValueReportPdfBuilder _firstValueReportPdfBuilder =
        firstValueReportPdfBuilder ?? throw new ArgumentNullException(nameof(firstValueReportPdfBuilder));

    private readonly PilotScorecardBuilder _pilotScorecardBuilder =
        pilotScorecardBuilder ?? throw new ArgumentNullException(nameof(pilotScorecardBuilder));

    private readonly IPilotInProductScorecardService _pilotInProductScorecardService =
        pilotInProductScorecardService ?? throw new ArgumentNullException(nameof(pilotInProductScorecardService));

    private readonly PilotOutcomeSummaryService _pilotOutcomeSummaryService =
        pilotOutcomeSummaryService ?? throw new ArgumentNullException(nameof(pilotOutcomeSummaryService));

    private readonly RoiCostEvidenceCollectionResolver _roiCostEvidenceCollectionResolver =
        roiCostEvidenceCollectionResolver ?? throw new ArgumentNullException(nameof(roiCostEvidenceCollectionResolver));

    private readonly IPilotReportCardService _pilotReportCardService =
        pilotReportCardService ?? throw new ArgumentNullException(nameof(pilotReportCardService));

    private readonly SponsorOnePagerPdfBuilder _sponsorOnePagerPdfBuilder =
        sponsorOnePagerPdfBuilder ?? throw new ArgumentNullException(nameof(sponsorOnePagerPdfBuilder));

    private readonly IWhyArchLucidSnapshotService _whyArchLucidSnapshotService =
        whyArchLucidSnapshotService ?? throw new ArgumentNullException(nameof(whyArchLucidSnapshotService));

    private readonly ISponsorEvidencePackService _sponsorEvidencePackService =
        sponsorEvidencePackService ?? throw new ArgumentNullException(nameof(sponsorEvidencePackService));

    private readonly IRunDetailQueryService _runDetailQueryService =
        runDetailQueryService ?? throw new ArgumentNullException(nameof(runDetailQueryService));

    private readonly IPilotRunDeltaComputer _pilotRunDeltaComputer =
        pilotRunDeltaComputer ?? throw new ArgumentNullException(nameof(pilotRunDeltaComputer));

    private readonly IRecentPilotRunDeltasService _recentPilotRunDeltasService =
        recentPilotRunDeltasService ?? throw new ArgumentNullException(nameof(recentPilotRunDeltasService));

    private readonly IPilotCloseoutRepository _pilotCloseoutRepository =
        pilotCloseoutRepository ?? throw new ArgumentNullException(nameof(pilotCloseoutRepository));

    private readonly IBuyerProofPackBuilder _buyerProofPackBuilder =
        buyerProofPackBuilder ?? throw new ArgumentNullException(nameof(buyerProofPackBuilder));

    private readonly IAuditService _auditService =
        auditService ?? throw new ArgumentNullException(nameof(auditService));

    private readonly ValueReportBuilder _valueReportBuilder =
        valueReportBuilder ?? throw new ArgumentNullException(nameof(valueReportBuilder));

    private readonly IActorContext _actorContext =
        actorContext ?? throw new ArgumentNullException(nameof(actorContext));

    private readonly IScopeContextProvider _scopeContextProvider =
        scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    private readonly IPilotBaselineRepository _pilotBaselineRepository =
        pilotBaselineRepository ?? throw new ArgumentNullException(nameof(pilotBaselineRepository));
}
