using ArchLucid.Contracts.Integrations;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Notifications.Teams;
using ArchLucid.Core.Scoping;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Integrations;

public sealed partial class TeamsIncomingWebhookConnectionsController
{
    /// <summary>Returns the canonical v1 catalog of Teams notification triggers an operator can opt in to.</summary>
    [HttpGet("triggers")]
    [Authorize(Policy = ArchLucidPolicies.ReadAuthority)]
    [ProducesResponseType(typeof(IReadOnlyList<string>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public IActionResult GetTriggerCatalog()
    {
        return Ok(TeamsNotificationTriggerCatalog.All);
    }

    /// <summary>Teams notifications page bundle: connection row and trigger catalog.</summary>
    [HttpGet("page-bundle")]
    [Authorize(Policy = ArchLucidPolicies.ReadAuthority)]
    [ProducesResponseType(typeof(TeamsIncomingWebhookPageBundleResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetPageBundle(CancellationToken cancellationToken)
    {
        ScopeContext scope = scopeProvider.GetCurrentScope();

        TeamsIncomingWebhookConnectionResponse connection =
            await LoadConnectionAsync(scope.TenantId, cancellationToken).ConfigureAwait(false);

        TeamsIncomingWebhookPageBundleResponse body = new()
        {
            Connection = connection,
            TriggerCatalog = TeamsNotificationTriggerCatalog.All
        };

        return Ok(body);
    }
}
