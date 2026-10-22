using ArchLucid.Application.Admin;
using ArchLucid.Application.Tenancy;
using ArchLucid.Core.Agents;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Configuration.Summary;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Authority;

public sealed partial class RunsController
{
    /// <summary>Allowed engines and evaluation evidence for per-review selection (TB-2110).</summary>
    [HttpGet("model-engine-selection-options")]
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    [ProducesResponseType(typeof(ModelEngineSelectionOptionsResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<ModelEngineSelectionOptionsResponse>> GetModelEngineSelectionOptions(
        [FromServices] IWorkspaceAllowedEngineSetService allowedEngineSetService,
        [FromServices] IAgentModelAliasRegistry aliasRegistry,
        CancellationToken cancellationToken)
    {
        ModelEngineSelectionOptionsBuilder builder = new(allowedEngineSetService, aliasRegistry);
        ModelEngineSelectionOptionsResponse options =
            await builder.BuildAsync(cancellationToken).ConfigureAwait(false);

        return Ok(options);
    }
}
