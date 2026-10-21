using ArchLucid.Application.Runs;
using ArchLucid.Core.Persistence.ApplicationPorts.Architecture;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.CareerArtifacts;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Queries;

using Microsoft.Extensions.Configuration;

namespace ArchLucid.Application.Exports;

/// <inheritdoc cref="IRunExportCareerPostureGate" />
public sealed class RunExportCareerPostureGate(
    IRunDetailQueryService runDetailQueryService,
    IAuthorityQueryService authorityQueryService,
    IGraphSnapshotRepository graphSnapshotRepository,
    IAgentExecutionTraceRepository agentExecutionTraceRepository,
    IConfiguration configuration,
    IRunRepository runRepository,
    IArchitectureInventoryBindingRepository architectureInventoryBindingRepository) : IRunExportCareerPostureGate
{
    private readonly IRunDetailQueryService _runDetailQueryService =
        runDetailQueryService ?? throw new ArgumentNullException(nameof(runDetailQueryService));

    private readonly IAuthorityQueryService _authorityQueryService =
        authorityQueryService ?? throw new ArgumentNullException(nameof(authorityQueryService));

    private readonly IGraphSnapshotRepository _graphSnapshotRepository =
        graphSnapshotRepository ?? throw new ArgumentNullException(nameof(graphSnapshotRepository));

    private readonly IAgentExecutionTraceRepository _agentExecutionTraceRepository =
        agentExecutionTraceRepository ?? throw new ArgumentNullException(nameof(agentExecutionTraceRepository));

    private readonly IConfiguration _configuration =
        configuration ?? throw new ArgumentNullException(nameof(configuration));

    private readonly IRunRepository _runRepository =
        runRepository ?? throw new ArgumentNullException(nameof(runRepository));

    private readonly IArchitectureInventoryBindingRepository _architectureInventoryBindingRepository =
        architectureInventoryBindingRepository ?? throw new ArgumentNullException(nameof(architectureInventoryBindingRepository));

    /// <inheritdoc />
    public async Task EnsureAllowsExportRecordMetadataOrThrowAsync(
        Guid runId,
        ScopeContext scope,
        CancellationToken cancellationToken)
    {
        AuditExportCareerPostureGateResult gateResult = await AuditExportCareerPostureGate.ResolveForRunFilterAsync(
            runId,
            scope,
            _runDetailQueryService,
            _authorityQueryService,
            _graphSnapshotRepository,
            _agentExecutionTraceRepository,
            _configuration,
            _runRepository,
            _architectureInventoryBindingRepository,
            cancellationToken);

        if (!gateResult.IsBlocked)
            return;

        throw new CareerArtifactExportBlockedException(
            gateResult.BlockReason
                ?? $"Run export for '{runId}' is blocked by career artifact honesty gates.",
            gateResult.BlockReasonCode ?? CareerArtifactCompletenessValidator.TrailMissingCode);
    }
}
