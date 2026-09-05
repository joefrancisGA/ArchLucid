using ArchLucid.Api.Http;
using ArchLucid.Api.Http.Governance;
using ArchLucid.Application.Governance;
using ArchLucid.Application.Governance.PolicyPacks;
using ArchLucid.Application.Http;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Governance.PolicyPacks;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Governance.PolicyPacks;

using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.OutputCaching;

namespace ArchLucid.Api.Controllers.Governance;

public sealed partial class PolicyPacksController
{
    /// <summary>Returns each applicable enabled assignment as a separate resolved pack (no merge).</summary>
    [HttpGet("effective")]
    [OutputCache(PolicyName = "ImmutableShort")]
    [ProducesResponseType(typeof(EffectivePolicyPackSet), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status304NotModified)]
    public async Task<IActionResult> GetEffective(CancellationToken ct = default)
    {
        PolicyPackHttpResult<EffectivePolicyPackSet> result = await _httpFacade.GetEffectiveAsync(ct)
            .ConfigureAwait(false);

        IActionResult? scopeProblem = this.MapScopeOrNull(result);

        if (scopeProblem is not null)
            return scopeProblem;

        EffectivePolicyPackSet effective = result.Value!;
        ScopeContext scope = HttpContext.RequestServices.GetRequiredService<IScopeContextProvider>().GetCurrentScope();
        string fingerprint =
            $"effective|tenant={scope.TenantId:N}|workspace={scope.WorkspaceId:N}|project={scope.ProjectId:N}";
        string etag = ConditionalGetNegotiation.ComputeJsonResponseEtag(
            effective,
            ContractJson.CamelCaseIgnoreNullCompact,
            fingerprint);

        return this.OkWithConditionalEtag(effective, etag);
    }

    /// <summary>Returns the single merged effective policy pack content document.</summary>
    [HttpGet("effective-content")]
    [OutputCache(PolicyName = "ImmutableShort")]
    [ProducesResponseType(typeof(PolicyPackContentDocument), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status304NotModified)]
    public async Task<IActionResult> GetEffectiveContent(CancellationToken ct = default)
    {
        PolicyPackHttpResult<PolicyPackContentDocument> result = await _httpFacade.GetEffectiveContentAsync(ct)
            .ConfigureAwait(false);

        IActionResult? scopeProblem = this.MapScopeOrNull(result);

        if (scopeProblem is not null)
            return scopeProblem;

        PolicyPackContentDocument doc = result.Value!;
        ScopeContext scope = HttpContext.RequestServices.GetRequiredService<IScopeContextProvider>().GetCurrentScope();
        string fingerprint =
            $"effective-content|tenant={scope.TenantId:N}|workspace={scope.WorkspaceId:N}|project={scope.ProjectId:N}";
        string etag = ConditionalGetNegotiation.ComputeJsonResponseEtag(
            doc,
            ContractJson.CamelCaseIgnoreNullCompact,
            fingerprint);

        return this.OkWithConditionalEtag(doc, etag);
    }
}
