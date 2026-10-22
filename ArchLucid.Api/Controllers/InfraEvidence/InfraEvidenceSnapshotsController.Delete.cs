using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.InfraEvidence;

public sealed partial class InfraEvidenceSnapshotsController
{
    /// <summary>Deletes an inventory snapshot and derived IE-plane rows when it is not bound or referenced by audit evidence.</summary>
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    [HttpDelete("{snapshotId:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> DeleteSnapshot(Guid snapshotId, CancellationToken cancellationToken)
    {
        if (snapshotId == Guid.Empty)
        {
            return this.NotFoundProblem(
                "Inventory snapshot was not found.",
                ProblemTypes.ResourceNotFound);
        }

        ScopeContext scope = scopeProvider.GetCurrentScope();

        try
        {
            AzureInventorySnapshotDeleteResult result = await _snapshotDeleteService.TryDeleteAsync(
                scope,
                snapshotId,
                cancellationToken);

            if (result.Outcome == AzureInventorySnapshotDeleteOutcome.Deleted)
            {
                await _auditService.LogAsync(
                    new AuditEvent
                    {
                        TenantId = scope.TenantId,
                        WorkspaceId = scope.WorkspaceId,
                        ProjectId = scope.ProjectId,
                        EventType = AuditEventTypes.AzureInventorySnapshotDeleted,
                        DataJson = System.Text.Json.JsonSerializer.Serialize(new { snapshotId }),
                    },
                    cancellationToken);
            }

            return MapDeleteSnapshotResult(snapshotId, result);
        }
        catch (ConflictException ex)
        {
            return MapSnapshotSealedManifestConflict(ex);
        }
    }

    private IActionResult MapDeleteSnapshotResult(
        Guid snapshotId,
        AzureInventorySnapshotDeleteResult result)
    {
        switch (result.Outcome)
        {
            case AzureInventorySnapshotDeleteOutcome.Deleted:
                return NoContent();

            case AzureInventorySnapshotDeleteOutcome.NotFound:
                return this.NotFoundProblem(
                    "Inventory snapshot was not found.",
                    ProblemTypes.ResourceNotFound);

            case AzureInventorySnapshotDeleteOutcome.BlockedBoundToArchitecture:
                return this.ConflictProblem(
                    "This inventory snapshot is bound to an architecture identity. Detach the binding before deleting the snapshot.",
                    ProblemTypes.Conflict);

            case AzureInventorySnapshotDeleteOutcome.BlockedReferencedByAuditEvidence:
                return this.ConflictProblem(
                    "This inventory snapshot is referenced by immutable audit evidence. It cannot be deleted.",
                    ProblemTypes.Conflict);

            case AzureInventorySnapshotDeleteOutcome.BlockedReferencedByRemediationInstance:
                return this.ConflictProblem(
                    "This inventory snapshot is referenced by a remediation instance. Close or re-point the instance before deleting the snapshot.",
                    ProblemTypes.Conflict);

            default:
                throw new InvalidOperationException($"Unhandled delete outcome: {result.Outcome}");
        }
    }
}
