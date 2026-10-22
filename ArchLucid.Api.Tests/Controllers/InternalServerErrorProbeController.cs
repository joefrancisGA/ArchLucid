using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Tests.Controllers;

/// <summary>Test-only endpoint that throws an unmapped exception so integration tests can assert 500 Problem Details.</summary>
[ApiController]
[AllowAnonymous]
[Route("api-test/unhandled")]
public sealed class InternalServerErrorProbeController : ControllerBase
{
    [HttpGet("throw")]
    public IActionResult ThrowUnhandled()
    {
        throw new NotSupportedException("CorrelationId integration test probe.");
    }
}
