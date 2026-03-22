using System.Text.Json;
using ArchiForge.Api.Auth.Models;
using ArchiForge.Core.Audit;
using ArchiForge.Core.Scoping;
using ArchiForge.Decisioning.Advisory.Scheduling;
using ArchiForge.Persistence.Advisory;
using Asp.Versioning;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace ArchiForge.Api.Controllers;

[ApiController]
[Authorize(Policy = ArchiForgePolicies.ReadAuthority)]
[ApiVersion("1.0")]
[Route("api/advisory-scheduling")]
[EnableRateLimiting("fixed")]
public sealed class AdvisorySchedulingController(
    IScopeContextProvider scopeProvider,
    IAdvisoryScanScheduleRepository scheduleRepository,
    IAdvisoryScanExecutionRepository executionRepository,
    IArchitectureDigestRepository digestRepository,
    IAdvisoryScanRunner scanRunner,
    IScanScheduleCalculator scheduleCalculator,
    IAuditService auditService)
    : ControllerBase
{
    [HttpPost("schedules")]
    [Authorize(Policy = ArchiForgePolicies.ExecuteAuthority)]
    [ProducesResponseType(typeof(AdvisoryScanSchedule), StatusCodes.Status200OK)]
    public async Task<ActionResult<AdvisoryScanSchedule>> CreateSchedule(
        [FromBody] AdvisoryScanSchedule request,
        CancellationToken ct = default)
    {
        var scope = scopeProvider.GetCurrentScope();

        request.ScheduleId = Guid.NewGuid();
        request.TenantId = scope.TenantId;
        request.WorkspaceId = scope.WorkspaceId;
        request.ProjectId = scope.ProjectId;
        if (string.IsNullOrWhiteSpace(request.RunProjectSlug))
            request.RunProjectSlug = "default";
        request.CreatedUtc = DateTime.UtcNow;
        request.NextRunUtc = scheduleCalculator.ComputeNextRunUtc(request.CronExpression, DateTime.UtcNow);

        await scheduleRepository.CreateAsync(request, ct);

        await auditService.LogAsync(
            new AuditEvent
            {
                EventType = AuditEventTypes.AdvisoryScanScheduled,
                DataJson = JsonSerializer.Serialize(new { scheduleId = request.ScheduleId, request.Name }),
            },
            ct);

        return Ok(request);
    }

    [HttpGet("schedules")]
    [ProducesResponseType(typeof(IReadOnlyList<AdvisoryScanSchedule>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<AdvisoryScanSchedule>>> ListSchedules(CancellationToken ct = default)
    {
        var scope = scopeProvider.GetCurrentScope();

        var result = await scheduleRepository.ListByScopeAsync(
            scope.TenantId,
            scope.WorkspaceId,
            scope.ProjectId,
            ct);

        return Ok(result);
    }

    [HttpGet("schedules/{scheduleId:guid}/executions")]
    [ProducesResponseType(typeof(IReadOnlyList<AdvisoryScanExecution>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<IReadOnlyList<AdvisoryScanExecution>>> ListExecutions(
        Guid scheduleId,
        [FromQuery] int take = 30,
        CancellationToken ct = default)
    {
        var schedule = await scheduleRepository.GetByIdAsync(scheduleId, ct);
        if (schedule is null)
            return NotFound();

        var scope = scopeProvider.GetCurrentScope();
        if (!MatchesScope(schedule, scope))
            return NotFound();

        var items = await executionRepository.ListByScheduleAsync(scheduleId, take, ct);
        return Ok(items);
    }

    [HttpPost("schedules/{scheduleId:guid}/run")]
    [Authorize(Policy = ArchiForgePolicies.ExecuteAuthority)]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> RunNow(Guid scheduleId, CancellationToken ct = default)
    {
        var schedule = await scheduleRepository.GetByIdAsync(scheduleId, ct);
        if (schedule is null)
            return NotFound();

        var scope = scopeProvider.GetCurrentScope();
        if (!MatchesScope(schedule, scope))
            return NotFound();

        await scanRunner.RunScheduleAsync(schedule, ct);
        return Ok();
    }

    [HttpGet("digests")]
    [ProducesResponseType(typeof(IReadOnlyList<ArchitectureDigest>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<ArchitectureDigest>>> ListDigests(
        [FromQuery] int take = 20,
        CancellationToken ct = default)
    {
        var scope = scopeProvider.GetCurrentScope();

        var digests = await digestRepository.ListByScopeAsync(
            scope.TenantId,
            scope.WorkspaceId,
            scope.ProjectId,
            take,
            ct);

        return Ok(digests);
    }

    [HttpGet("digests/{digestId:guid}")]
    [ProducesResponseType(typeof(ArchitectureDigest), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ArchitectureDigest>> GetDigest(Guid digestId, CancellationToken ct = default)
    {
        var digest = await digestRepository.GetByIdAsync(digestId, ct);
        if (digest is null)
            return NotFound();

        var scope = scopeProvider.GetCurrentScope();
        if (digest.TenantId != scope.TenantId ||
            digest.WorkspaceId != scope.WorkspaceId ||
            digest.ProjectId != scope.ProjectId)
            return NotFound();

        return Ok(digest);
    }

    private static bool MatchesScope(AdvisoryScanSchedule schedule, ScopeContext scope) =>
        schedule.TenantId == scope.TenantId &&
        schedule.WorkspaceId == scope.WorkspaceId &&
        schedule.ProjectId == scope.ProjectId;
}
