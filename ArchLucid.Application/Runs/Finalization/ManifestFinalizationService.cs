using ArchLucid.Application.Governance;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Runs;
using ArchLucid.Core.Runs.Finalization;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Transactions;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.IntegrationOutbox;
using ArchLucid.Persistence.Models;

using Microsoft.Extensions.Logging;

namespace ArchLucid.Application.Runs.Finalization;

/// <inheritdoc cref = "IManifestFinalizationService"/>
public sealed partial class ManifestFinalizationService(
    IArchLucidUnitOfWorkFactory unitOfWorkFactory,
    IScopeContextProvider scopeContextProvider,
    IRunRepository runRepository,
    IFindingsSnapshotRepository findingsSnapshotRepository,
    IDecisionTraceRepository decisionTraceRepository,
    IGoldenManifestRepository goldenManifestRepository,
    IManifestHashService manifestHashService,
    IAuditService auditService,
    IIntegrationEventOutboxRepository integrationEventOutbox,
    IManifestFinalizationSqlRepository manifestFinalizationSqlRepository,
    IRunStateTransitionService runStateTransitionService,
    ICommittedEffectiveGovernanceSnapshotCapturer committedEffectiveGovernanceSnapshotCapturer,
    ICommittedReviewStandardsSnapshotCapturer committedReviewStandardsSnapshotCapturer,
    ILogger<ManifestFinalizationService> logger) : IManifestFinalizationService
{
    private readonly IAuditService _auditService = auditService ?? throw new ArgumentNullException(nameof(auditService));

    private readonly IIntegrationEventOutboxRepository _integrationEventOutbox =
        integrationEventOutbox ?? throw new ArgumentNullException(nameof(integrationEventOutbox));

    private readonly IManifestHashService _manifestHashService = manifestHashService ?? throw new ArgumentNullException(nameof(manifestHashService));
    private readonly IScopeContextProvider _scopeContextProvider = scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    private readonly IGoldenManifestRepository _goldenManifestRepository =
        goldenManifestRepository ?? throw new ArgumentNullException(nameof(goldenManifestRepository));

    private readonly IRunRepository _runRepository = runRepository ?? throw new ArgumentNullException(nameof(runRepository));

    private readonly IDecisionTraceRepository _decisionTraceRepository =
        decisionTraceRepository ?? throw new ArgumentNullException(nameof(decisionTraceRepository));

    private readonly IFindingsSnapshotRepository _findingsSnapshotRepository =
        findingsSnapshotRepository ?? throw new ArgumentNullException(nameof(findingsSnapshotRepository));

    private readonly IArchLucidUnitOfWorkFactory _unitOfWorkFactory = unitOfWorkFactory ?? throw new ArgumentNullException(nameof(unitOfWorkFactory));

    private readonly IManifestFinalizationSqlRepository _manifestFinalizationSqlRepository =
        manifestFinalizationSqlRepository ?? throw new ArgumentNullException(nameof(manifestFinalizationSqlRepository));

    private readonly IRunStateTransitionService _runStateTransitionService =
        runStateTransitionService ?? throw new ArgumentNullException(nameof(runStateTransitionService));

    private readonly ICommittedEffectiveGovernanceSnapshotCapturer _committedEffectiveGovernanceSnapshotCapturer =
        committedEffectiveGovernanceSnapshotCapturer ?? throw new ArgumentNullException(nameof(committedEffectiveGovernanceSnapshotCapturer));

    private readonly ICommittedReviewStandardsSnapshotCapturer _committedReviewStandardsSnapshotCapturer =
        committedReviewStandardsSnapshotCapturer ?? throw new ArgumentNullException(nameof(committedReviewStandardsSnapshotCapturer));

    private readonly ILogger<ManifestFinalizationService> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    /// <inheritdoc/>
    public async Task<ManifestFinalizationResult> FinalizeAsync(ManifestFinalizationRequest request, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);
        ArgumentNullException.ThrowIfNull(request.ManifestModel);
        ArgumentNullException.ThrowIfNull(request.Contract);
        ArgumentNullException.ThrowIfNull(request.Keying);
        ArgumentNullException.ThrowIfNull(request.Trace);
        ScopeContext scope = scopeContextProvider.GetCurrentScope();
        await using IArchLucidUnitOfWork uow = await unitOfWorkFactory.CreateAsync(cancellationToken);
        try
        {
            if (uow.SupportsExternalTransaction)
                return await FinalizeSqlAsync(scope, request, uow, cancellationToken);
            return await FinalizeLegacyAsync(scope, request, uow, cancellationToken);
        }
        catch
        {
            await uow.RollbackAsync(cancellationToken);
            throw;
        }
    }
}
