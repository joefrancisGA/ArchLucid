using ArchLucid.Application.Runs;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.User;
using ArchLucid.Core.Persistence.ApplicationPorts.Architecture;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.CareerArtifacts;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Queries;

using Microsoft.Extensions.Configuration;

namespace ArchLucid.Application.Exports;

/// <summary>CG-026 — blocks unlabeled Working Career Simulator audit CSV; stamps Mode/door when allowed.</summary>
public static class AuditExportCareerPostureGate
{
    public static async Task<AuditExportCareerPostureGateResult> ResolveForRunFilterAsync(
        Guid runId,
        ScopeContext scope,
        IRunDetailQueryService runDetailQueryService,
        IAuthorityQueryService authorityQueryService,
        IGraphSnapshotRepository graphSnapshotRepository,
        IAgentExecutionTraceRepository agentExecutionTraceRepository,
        IConfiguration configuration,
        IRunRepository runRepository,
        IArchitectureInventoryBindingRepository architectureInventoryBindingRepository,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(runDetailQueryService);
        ArgumentNullException.ThrowIfNull(authorityQueryService);
        ArgumentNullException.ThrowIfNull(graphSnapshotRepository);
        ArgumentNullException.ThrowIfNull(agentExecutionTraceRepository);
        ArgumentNullException.ThrowIfNull(configuration);
        ArgumentNullException.ThrowIfNull(runRepository);
        ArgumentNullException.ThrowIfNull(architectureInventoryBindingRepository);
        ArgumentNullException.ThrowIfNull(scope);

        ArchitectureRunDetail? detail = await runDetailQueryService
            .GetRunDetailAsync(runId.ToString("N"), cancellationToken);

        if (detail is null)
        {
            return AllowedWithoutStamp();
        }

        CareerExportCoverageHonestyInput careerExportHonesty = await CareerExportCoverageHonestyMaterialLoader.LoadAsync(
            detail,
            authorityQueryService,
            graphSnapshotRepository,
            agentExecutionTraceRepository,
            scope,
            workingDesk: true,
            configuration,
            cancellationToken,
            runRepository,
            architectureInventoryBindingRepository);

        CareerArtifactCompletenessInput validatorInput = CareerArtifactCompletenessInputMapper.MapForExport(
            careerExportHonesty,
            careerExportHonesty.CoverageContext.Verdict?.TransparencyTrail);

        CareerArtifactExportBlock? block = CareerArtifactExportCompletenessGate.ResolveBlock(
            careerExportHonesty,
            validatorInput);

        if (block is not null)
        {
            return new AuditExportCareerPostureGateResult(
                IsBlocked: true,
                BlockReasonCode: block.Code,
                BlockReason: block.Message,
                Stamp: null);
        }

        string door = WorkingCareerRehearsalDoorValues.ParseOrDefault(careerExportHonesty.WorkingCareerRehearsalDoor);
        bool rehearsalIncomplete = DecisionReceiptCareerPostureStamper.ResolveRehearsalIncomplete(
            careerExportHonesty.StructuralExecutionMode,
            door);

        AuditExportCareerPostureStamp stamp = new(
            careerExportHonesty.StructuralExecutionMode.ToString(),
            door,
            rehearsalIncomplete);

        return new AuditExportCareerPostureGateResult(
            IsBlocked: false,
            BlockReasonCode: null,
            BlockReason: null,
            Stamp: stamp);
    }

    private static AuditExportCareerPostureGateResult AllowedWithoutStamp() =>
        new(IsBlocked: false, BlockReasonCode: null, BlockReason: null, Stamp: null);
}
