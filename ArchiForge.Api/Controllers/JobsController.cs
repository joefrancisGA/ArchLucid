using ArchiForge.Api.Auth.Models;
using ArchiForge.Api.Jobs;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ArchiForge.Api.Controllers;

[ApiController]
[Authorize(Policy = ArchiForgePolicies.ReadAuthority)]
[Route("v{version:apiVersion}/jobs")]
[ApiVersion("1.0")]
public sealed class JobsController(IBackgroundJobQueue jobs) : ControllerBase
{
    [HttpGet("{jobId}")]
    [ProducesResponseType(typeof(BackgroundJobInfo), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public IActionResult GetJob([FromRoute] string jobId)
    {
        if (string.IsNullOrWhiteSpace(jobId))
            return BadRequest(new { error = "jobId is required." });

        var info = jobs.GetInfo(jobId);
        if (info is null)
            return NotFound();
        return Ok(info);
    }

    [HttpGet("{jobId}/file")]
    [ProducesResponseType(typeof(FileContentResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(BackgroundJobInfo), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(BackgroundJobInfo), StatusCodes.Status409Conflict)]
    public IActionResult DownloadJobFile([FromRoute] string jobId)
    {
        if (string.IsNullOrWhiteSpace(jobId))
            return BadRequest(new { error = "jobId is required." });

        var info = jobs.GetInfo(jobId);
        if (info is null)
            return NotFound();
        if (info.State != BackgroundJobState.Succeeded)
            return Conflict(info);

        var file = jobs.GetFile(jobId);
        if (file is null)
            return Conflict(info);

        return File(file.Bytes, file.ContentType, file.FileName);
    }
}

