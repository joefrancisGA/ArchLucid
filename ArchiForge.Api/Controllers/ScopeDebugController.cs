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
public sealed class ScopeDebugController : ControllerBase
{
    private readonly IScopeContextProvider _scopeProvider;

    public ScopeDebugController(IScopeContextProvider scopeProvider)
    {
        _scopeProvider = scopeProvider;
    }

    [HttpGet]
    [ProducesResponseType(typeof(ScopeContext), StatusCodes.Status200OK)]
    public IActionResult GetScope()
    {
        var scope = _scopeProvider.GetCurrentScope();
        return Ok(scope);
    }
}
