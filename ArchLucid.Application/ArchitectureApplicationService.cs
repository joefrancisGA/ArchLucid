using ArchLucid.Application.Common;
using ArchLucid.Application.Diagnostics;
using ArchLucid.Application.Evidence;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Persistence;
using ArchLucid.Core.Runs;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Transactions;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.Connections;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Interfaces;

using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace ArchLucid.Application;

/// <summary>
///     API-facing orchestration service that coordinates run retrieval, agent result submission,
///     manifest access, and fake-result seeding for the architecture run lifecycle.
/// </summary>
/// <remarks>
///     All run reads are routed through <c>IRunDetailQueryService</c> to ensure a single authoritative
///     data-loading path. Result and evidence writes execute inside <see cref="IArchLucidUnitOfWork"/> for atomicity.
///     Execute/commit orchestrators own most Authority <c>dbo.Runs</c> transitions. Development-only
///     <see cref="SeedFakeResultsAsync"/> also promotes Authority <c>LegacyRunStatus</c> so seeded runs can
///     reach commit without calling execute (TB-937 requires <c>ReadyForCommit</c>).
/// </remarks>
public sealed partial class ArchitectureApplicationService(
    IRunDetailQueryService runDetailQueryService,
    IAgentResultRepository resultRepository,
    IUnifiedGoldenManifestReader unifiedGoldenManifestReader,
    IArchitectureRequestRepository requestRepository,
    IAgentEvidencePackageRepository agentEvidencePackageRepository,
    IEvidenceBuilder evidenceBuilder,
    IArchLucidUnitOfWorkFactory unitOfWorkFactory,
    IRunRepository runRepository,
    IScopeContextProvider scopeContextProvider,
    IConfiguration configuration,
    IAuditService auditService,
    IActorContext actorContext,
    IAgentArchitectureFindingConfidenceEnricher architectureFindingConfidenceEnricher,
    IRunStateTransitionService runStateTransitionService,
    ILogger<ArchitectureApplicationService> logger) : IArchitectureApplicationService
{
    private readonly IRunDetailQueryService _runDetailQueryService = runDetailQueryService ?? throw new ArgumentNullException(nameof(runDetailQueryService));
    private readonly IActorContext _actorContext = actorContext ?? throw new ArgumentNullException(nameof(actorContext));

    private readonly IAgentArchitectureFindingConfidenceEnricher _architectureFindingConfidenceEnricher =
        architectureFindingConfidenceEnricher ?? throw new ArgumentNullException(nameof(architectureFindingConfidenceEnricher));

    private readonly IAuditService _auditService = auditService ?? throw new ArgumentNullException(nameof(auditService));
    private readonly IAgentResultRepository _resultRepository = resultRepository ?? throw new ArgumentNullException(nameof(resultRepository));
    private readonly ILogger<ArchitectureApplicationService> _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    private readonly IScopeContextProvider _scopeContextProvider = scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));
    private readonly IConfiguration _configuration = configuration ?? throw new ArgumentNullException(nameof(configuration));

    private readonly IAgentEvidencePackageRepository _agentEvidencePackageRepository =
        agentEvidencePackageRepository ?? throw new ArgumentNullException(nameof(agentEvidencePackageRepository));

    private readonly IRunRepository _runRepository = runRepository ?? throw new ArgumentNullException(nameof(runRepository));
    private readonly IArchitectureRequestRepository _requestRepository = requestRepository ?? throw new ArgumentNullException(nameof(requestRepository));
    private readonly IEvidenceBuilder _evidenceBuilder = evidenceBuilder ?? throw new ArgumentNullException(nameof(evidenceBuilder));
    private readonly IArchLucidUnitOfWorkFactory _unitOfWorkFactory = unitOfWorkFactory ?? throw new ArgumentNullException(nameof(unitOfWorkFactory));

    private readonly IUnifiedGoldenManifestReader _unifiedGoldenManifestReader =
        unifiedGoldenManifestReader ?? throw new ArgumentNullException(nameof(unifiedGoldenManifestReader));

    private readonly IRunStateTransitionService _runStateTransitionService =
        runStateTransitionService ?? throw new ArgumentNullException(nameof(runStateTransitionService));

    public async Task<GetRunResult?> GetRunAsync(string runId, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(runId))
            return null;
        ArchitectureRunDetail? detail = await runDetailQueryService.GetRunDetailAsync(runId, cancellationToken);
        return detail is null ? null : new GetRunResult(detail.Run, detail.Tasks, detail.Results);
    }

    public async Task<Contracts.Manifest.GoldenManifest?> GetManifestAsync(string version, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(version);
        return await unifiedGoldenManifestReader.GetByVersionAsync(version, cancellationToken);
    }
}
