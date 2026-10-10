using ArchLucid.Core.Configuration;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Application.Bootstrap.Seeders;

/// <summary>
///     Final demo seed step: backfill <c>ManifestGenerated</c> audit anchors for Workspace A/B evaluator runs
///     under the correct workspace scope (export lineage gates / TB-307).
/// </summary>
public sealed class DemoSeedExportLineageAuditRepairSeeder(
    DemoSeedSeederDependencies deps) : IDemoSeedScenarioSeeder
{
    private readonly DemoSeedSeederDependencies _deps = deps ?? throw new ArgumentNullException(nameof(deps));

    private static readonly string[] OwnedSteps = ["demo-export-lineage-repair"];

    public IReadOnlyCollection<string> StepNames => OwnedSteps;

    public Task SeedStepAsync(string stepName, CancellationToken cancellationToken) => stepName switch
    {
        "demo-export-lineage-repair" => RepairEvaluatorWorkspaceExportLineageAnchorsAsync(cancellationToken),
        _ => throw new ArgumentOutOfRangeException(nameof(stepName), stepName, "Unknown demo seed step."),
    };

    private async Task RepairEvaluatorWorkspaceExportLineageAnchorsAsync(CancellationToken cancellationToken)
    {
        ScopeContext baseline = _deps.ScopeContextProvider.GetCurrentScope();

        if (baseline.TenantId != ScopeIds.DefaultTenant)
            return;

        Guid tenantId = baseline.TenantId;

        ScopeContext productTourScope = new()
        {
            TenantId = tenantId,
            WorkspaceId = DemoTourWorkspaceIds.WorkspaceRowId(tenantId),
            ProjectId = DemoTourWorkspaceIds.ProjectScopeRowId(tenantId),
        };

        using (AmbientScopeContext.Push(productTourScope))
        {
            await DemoSeedSealedExportReceiptRepair.TryEnsureSealedExportReceiptFieldsAsync(
                _deps,
                productTourScope,
                DemoWorkspaceStableIds.ProductTourArchitectureReviewRunId,
                cancellationToken);

            await DemoSeedExportLineageAuditRepair.TryEnsureManifestGeneratedExportLineageAnchorAsync(
                _deps,
                productTourScope,
                DemoWorkspaceStableIds.ProductTourArchitectureReviewRunId,
                cancellationToken);
        }

        ScopeContext regulatedScope = new()
        {
            TenantId = tenantId,
            WorkspaceId = DemoRegulatedScenarioWorkspaceIds.WorkspaceRowId(tenantId),
            ProjectId = DemoRegulatedScenarioWorkspaceIds.ProjectScopeRowId(tenantId),
        };

        using (AmbientScopeContext.Push(regulatedScope))
        {
            await DemoSeedSealedExportReceiptRepair.TryEnsureSealedExportReceiptFieldsAsync(
                _deps,
                regulatedScope,
                DemoWorkspaceStableIds.RegulatedScenarioArchitectureReviewRunId,
                cancellationToken);

            await DemoSeedExportLineageAuditRepair.TryEnsureManifestGeneratedExportLineageAnchorAsync(
                _deps,
                regulatedScope,
                DemoWorkspaceStableIds.RegulatedScenarioArchitectureReviewRunId,
                cancellationToken);
        }
    }
}
