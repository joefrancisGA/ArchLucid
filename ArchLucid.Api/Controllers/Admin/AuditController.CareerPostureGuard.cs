using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application.Exports;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.CareerArtifacts;

using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Admin;

public sealed partial class AuditController
{
    private async Task<(IActionResult? BlockedResult, AuditExportCareerPostureStamp? Stamp)> ResolveAuditCsvCareerPostureAsync(
        Guid? runId,
        ScopeContext scope,
        CancellationToken cancellationToken)
    {
        if (runId is null || runId.Value == Guid.Empty)
        {
            return (null, null);
        }

        AuditExportCareerPostureGateResult gateResult = await AuditExportCareerPostureGate.ResolveForRunFilterAsync(
            runId.Value,
            scope,
            runDetailQueryService,
            authorityQueryService,
            graphSnapshotRepository,
            agentExecutionTraceRepository,
            configuration,
            runRepository,
            architectureInventoryBindingRepository,
            cancellationToken);

        if (!gateResult.IsBlocked)
        {
            return (null, gateResult.Stamp);
        }

        IActionResult blocked = this.CareerArtifactBlockedProblem(
            gateResult.BlockReason
                ?? $"Audit CSV export for run '{runId.Value}' is blocked by career artifact honesty gates.",
            gateResult.BlockReasonCode ?? CareerArtifactCompletenessValidator.TrailMissingCode);

        return (blocked, null);
    }
}
