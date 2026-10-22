using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application.Exports;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.CareerArtifacts;

using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Authority;

public sealed partial class ArtifactExportController
{
    private async Task<IActionResult?> ResolveRunExportCareerPostureBlockedResultAsync(
        Guid runId,
        ScopeContext scope,
        CancellationToken cancellationToken)
    {
        AuditExportCareerPostureGateResult gateResult = await AuditExportCareerPostureGate.ResolveForRunFilterAsync(
            runId,
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
            return null;
        }

        return this.CareerArtifactBlockedProblem(
            gateResult.BlockReason
                ?? $"Run export for '{runId}' is blocked by career artifact honesty gates.",
            gateResult.BlockReasonCode ?? CareerArtifactCompletenessValidator.TrailMissingCode);
    }
}
