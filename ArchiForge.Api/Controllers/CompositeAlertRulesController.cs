using System.Text.Json;
using ArchiForge.Api.Auth.Models;
using ArchiForge.Core.Audit;
using ArchiForge.Core.Scoping;
using ArchiForge.Decisioning.Alerts.Composite;
using Asp.Versioning;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace ArchiForge.Api.Controllers;

[ApiController]
[Authorize(Policy = ArchiForgePolicies.ReadAuthority)]
[ApiVersion("1.0")]
[Route("api/composite-alert-rules")]
[EnableRateLimiting("fixed")]
public sealed class CompositeAlertRulesController : ControllerBase
{
    private readonly IScopeContextProvider _scopeProvider;
    private readonly ICompositeAlertRuleRepository _repository;
    private readonly IAuditService _auditService;

    public CompositeAlertRulesController(
        IScopeContextProvider scopeProvider,
        ICompositeAlertRuleRepository repository,
        IAuditService auditService)
    {
        _scopeProvider = scopeProvider;
        _repository = repository;
        _auditService = auditService;
    }

    [HttpPost]
    [Authorize(Policy = ArchiForgePolicies.ExecuteAuthority)]
    [ProducesResponseType(typeof(CompositeAlertRule), StatusCodes.Status200OK)]
    public async Task<ActionResult<CompositeAlertRule>> Create(
        [FromBody] CompositeAlertRule rule,
        CancellationToken ct = default)
    {
        var scope = _scopeProvider.GetCurrentScope();

        rule.CompositeRuleId = Guid.NewGuid();
        rule.TenantId = scope.TenantId;
        rule.WorkspaceId = scope.WorkspaceId;
        rule.ProjectId = scope.ProjectId;
        rule.CreatedUtc = DateTime.UtcNow;

        foreach (var c in rule.Conditions)
        {
            if (c.ConditionId == Guid.Empty)
                c.ConditionId = Guid.NewGuid();
        }

        await _repository.CreateAsync(rule, ct);

        await _auditService.LogAsync(
            new AuditEvent
            {
                EventType = AuditEventTypes.CompositeAlertRuleCreated,
                DataJson = JsonSerializer.Serialize(new
                {
                    rule.CompositeRuleId,
                    rule.Name,
                    rule.Operator,
                    conditionCount = rule.Conditions.Count,
                }),
            },
            ct);

        return Ok(rule);
    }

    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<CompositeAlertRule>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<CompositeAlertRule>>> List(CancellationToken ct = default)
    {
        var scope = _scopeProvider.GetCurrentScope();

        var result = await _repository.ListByScopeAsync(
            scope.TenantId,
            scope.WorkspaceId,
            scope.ProjectId,
            ct);

        return Ok(result);
    }
}
