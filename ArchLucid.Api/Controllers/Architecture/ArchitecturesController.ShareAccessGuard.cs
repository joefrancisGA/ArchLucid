using ArchLucid.Application.Architecture;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Core.Scoping;

using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Architecture;

public sealed partial class ArchitecturesController
{
    private async Task<IActionResult?> EnsureArchitectureShareReadAllowedAsync(
        ScopeContext scope,
        Guid architectureId,
        CancellationToken cancellationToken)
    {
        return await _architectureShareAccessGate.EnsureArchitectureReadAllowedAsync(
            this,
            User,
            scope,
            architectureId,
            cancellationToken);
    }

    private async Task<IActionResult?> EnsureArchitectureShareDecideAllowedAsync(
        ScopeContext scope,
        Guid architectureId,
        CancellationToken cancellationToken)
    {
        return await _architectureShareAccessGate.EnsureArchitectureDecideAllowedAsync(
            this,
            User,
            scope,
            architectureId,
            cancellationToken);
    }

    private async Task<IActionResult?> EnsureArchitectureShareAdminAllowedAsync(
        ScopeContext scope,
        Guid architectureId,
        CancellationToken cancellationToken)
    {
        return await _architectureShareAccessGate.EnsureArchitectureAdminAllowedAsync(
            this,
            User,
            scope,
            architectureId,
            cancellationToken);
    }

    private async Task<ArchitectureIdentityListPage> FilterArchitectureListByShareAccessAsync(
        ScopeContext scope,
        ArchitectureIdentityListPage page,
        CancellationToken cancellationToken)
    {
        List<ArchitectureIdentityListItem> visibleItems = [];

        foreach (ArchitectureIdentityListItem item in page.Items)
        {
            ArchitectureShareAccessEvaluation access = await _architectureShareAccessGate.EvaluateArchitectureAsync(
                User,
                scope,
                item.ArchitectureId,
                cancellationToken);

            if (access.CanRead)
                visibleItems.Add(item);
        }

        int hiddenRestrictedCount = await CountRestrictedWithoutActorShareAsync(scope, page, cancellationToken);
        int adjustedTotalCount = Math.Max(0, page.TotalCount - hiddenRestrictedCount);

        return new ArchitectureIdentityListPage
        {
            Items = visibleItems,
            TotalCount = adjustedTotalCount,
            Page = page.Page,
            PageSize = page.PageSize,
        };
    }

    private async Task<int> CountRestrictedWithoutActorShareAsync(
        ScopeContext scope,
        ArchitectureIdentityListPage page,
        CancellationToken cancellationToken)
    {
        int hidden = 0;

        foreach (ArchitectureIdentityListItem item in page.Items)
        {
            ArchitectureShareAccessEvaluation access = await _architectureShareAccessGate.EvaluateArchitectureAsync(
                User,
                scope,
                item.ArchitectureId,
                cancellationToken);

            if (!access.CanRead)
                hidden++;
        }

        return hidden;
    }
}
