using ArchLucid.Application.Bootstrap;
using ArchLucid.Application.Explanation;
using ArchLucid.Application.Roi;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Core.Agents;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Explanation;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.Audit;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Queries;

using Microsoft.Extensions.Logging;

namespace ArchLucid.Application.Pilots;

/// <inheritdoc cref = "IPilotRunDeltaComputer"/>
/// <remarks>
///     Read-only by construction: makes one filtered audit query, one trace count (or full-trace list when PilotStrict
///     needs <c>ParsedResultJson</c>), one artifact-descriptor list (when a golden manifest id exists), and at most one
///     evidence-chain query per call. Failures in the audit / trace / artifact / evidence queries are swallowed
///     (warning-logged) so a sponsor report still renders for runs whose ancillary stores are temporarily unavailable.
/// </remarks>
public sealed partial class PilotRunDeltaComputer(
    IFindingEvidenceChainService evidenceChainService,
    IAgentExecutionTraceRepository agentExecutionTraceRepository,
    IAuditRepository auditRepository,
    IArtifactQueryService artifactQueryService,
    ITenantEstimatedUsdSavingsResolver tenantEstimatedUsdSavingsResolver,
    IFindingsSnapshotRepository findingsSnapshotRepository,
    IScopeContextProvider scopeContextProvider,
    IRunExplanationSummaryService runExplanationSummaryService,
    IRunAgentOutputPilotEvidenceAggregator pilotEvidenceAggregator,
    IAgentOutputQualityGateOptionsResolver gateOptionsResolver,
    ILogger<PilotRunDeltaComputer> logger) : IPilotRunDeltaComputer
{
    private readonly IAgentExecutionTraceRepository _agentExecutionTraceRepository =
        agentExecutionTraceRepository ?? throw new ArgumentNullException(nameof(agentExecutionTraceRepository));

    private readonly IArtifactQueryService _artifactQueryService = artifactQueryService ?? throw new ArgumentNullException(nameof(artifactQueryService));
    private readonly IAuditRepository _auditRepository = auditRepository ?? throw new ArgumentNullException(nameof(auditRepository));
    private readonly ITenantEstimatedUsdSavingsResolver _tenantEstimatedUsdSavingsResolver =
        tenantEstimatedUsdSavingsResolver ?? throw new ArgumentNullException(nameof(tenantEstimatedUsdSavingsResolver));
    private readonly IFindingsSnapshotRepository _findingsSnapshotRepository =
        findingsSnapshotRepository ?? throw new ArgumentNullException(nameof(findingsSnapshotRepository));
    private readonly IFindingEvidenceChainService _evidenceChainService = evidenceChainService ?? throw new ArgumentNullException(nameof(evidenceChainService));
    private readonly ILogger<PilotRunDeltaComputer> _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    private readonly IScopeContextProvider _scopeContextProvider = scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    private readonly IRunExplanationSummaryService _runExplanationSummaryService =
        runExplanationSummaryService ?? throw new ArgumentNullException(nameof(runExplanationSummaryService));

    private readonly IRunAgentOutputPilotEvidenceAggregator _pilotEvidenceAggregator =
        pilotEvidenceAggregator ?? throw new ArgumentNullException(nameof(pilotEvidenceAggregator));

    private readonly IAgentOutputQualityGateOptionsResolver _gateOptionsResolver =
        gateOptionsResolver ?? throw new ArgumentNullException(nameof(gateOptionsResolver));
}
