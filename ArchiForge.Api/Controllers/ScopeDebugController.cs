using ArchiForge.Api.Auth.Models;
using ArchiForge.Core.Scoping;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ArchiForge.Api.Controllers;

[ApiController]
[Authorize(Policy = ArchiForgePolicies.ReadAuthority)]
[ApiVersion("1.0")]
[Route("api/scope")]
public sealed class ScopeDebugController(IScopeContextProvider scopeProvider) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType(typeof(ScopeContext), StatusCodes.Status200OK)]
    public IActionResult GetScope()
    {
        var scope = scopeProvider.GetCurrentScope();
        return Ok(scope);
    }
}
