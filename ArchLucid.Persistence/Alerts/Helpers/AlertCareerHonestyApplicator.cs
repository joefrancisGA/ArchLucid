using ArchLucid.Contracts.Alerts;
using ArchLucid.Core.Alerts;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Queries;

namespace ArchLucid.Persistence.Alerts.Helpers;

/// <summary>CG-036 — stamps alert copy from the sourcing run before persist/deliver.</summary>
internal static class AlertCareerHonestyApplicator
{
    internal static async Task ApplyAsync(
        AlertRecord alert,
        AlertEvaluationContext context,
        IAuthorityQueryService authorityQueryService,
        CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(alert);
        ArgumentNullException.ThrowIfNull(context);
        ArgumentNullException.ThrowIfNull(authorityQueryService);

        Guid? runId = alert.RunId ?? context.RunId;

        if (!runId.HasValue)
        {
            return;
        }

        ScopeContext scope = new()
        {
            TenantId = context.TenantId,
            WorkspaceId = context.WorkspaceId,
            ProjectId = context.ProjectId,
        };

        RunSummaryDto? runSummary = await authorityQueryService
            .GetRunSummaryAsync(scope, runId.Value, ct)
            ;

        if (runSummary is null)
        {
            return;
        }

        AlertCareerHonestyPresenter.ApplyToAlert(alert, runSummary);
    }
}
