using ArchLucid.Api.Attributes;
using ArchLucid.Api.Controllers.OperationalSecurity;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application.Common;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.InfraEvidence;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace ArchLucid.Api.Controllers.OperationalSecurity;

[ApiController]
[Authorize(Policy = ArchLucidPolicies.ReadAuthority)]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/operational-security/remediation-patterns")]
[EnableRateLimiting("fixed")]
[RequiresCommercialTenantTier(TenantTier.Standard)]
public sealed class RemediationPatternsController(
    IRemediationPatternService patternService,
    IScopeContextProvider scopeProvider,
    IActorContext actorContext) : ControllerBase
{
    // idempotency-posture: operator-documented-safe-retry
    [HttpPost("draft")]
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    [MutatingAuditExcluded("Remediation pattern draft is tenant-scoped registry metadata.")]
    [ProducesResponseType(typeof(RemediationPatternOperationResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreateDraft(
        [FromBody] RemediationPatternDraftApiRequest? request,
        CancellationToken cancellationToken = default)
    {
        if (request is null)
            return this.BadRequestProblem("Request body is required.", ProblemTypes.RequestBodyRequired);

        ScopeContext scope = scopeProvider.GetCurrentScope();

        RemediationPatternOperationResult result = await patternService.CreateDraftAsync(
            scope,
            MapDraftRequest(request),
            actorContext.GetActorId(),
            cancellationToken);

        if (!result.Succeeded)
            return this.BadRequestProblem(result.ErrorMessage ?? "Draft creation failed.", ProblemTypes.ValidationFailed);

        return Ok(result);
    }

    // idempotency-posture: operator-documented-safe-retry
    [HttpPost("{patternId:guid}/submit")]
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    [MutatingAuditExcluded("Remediation pattern submit transitions version status only.")]
    public async Task<IActionResult> SubmitForReview(
        Guid patternId,
        [FromBody] RemediationPatternVersionActionRequest? request,
        CancellationToken cancellationToken = default)
    {
        if (request is null || string.IsNullOrWhiteSpace(request.Version))
            return this.BadRequestProblem("Version is required.", ProblemTypes.ValidationFailed);

        ScopeContext scope = scopeProvider.GetCurrentScope();

        RemediationPatternOperationResult result = await patternService.SubmitForReviewAsync(
            scope,
            patternId,
            request.Version,
            actorContext.GetActorId(),
            cancellationToken);

        if (!result.Succeeded)
            return this.BadRequestProblem(result.ErrorMessage ?? "Submit failed.", ProblemTypes.ValidationFailed);

        return Ok(result);
    }

    // idempotency-posture: operator-documented-safe-retry
    [HttpPost("{patternId:guid}/approve")]
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    [MutatingAuditExcluded("Remediation pattern approval enforces SoD in service layer.")]
    public async Task<IActionResult> Approve(
        Guid patternId,
        [FromBody] RemediationPatternVersionActionRequest? request,
        CancellationToken cancellationToken = default)
    {
        if (request is null || string.IsNullOrWhiteSpace(request.Version))
            return this.BadRequestProblem("Version is required.", ProblemTypes.ValidationFailed);

        ScopeContext scope = scopeProvider.GetCurrentScope();

        RemediationPatternOperationResult result = await patternService.ApproveAsync(
            scope,
            patternId,
            request.Version,
            actorContext.GetActorId(),
            cancellationToken);

        if (!result.Succeeded)
            return this.BadRequestProblem(result.ErrorMessage ?? "Approval failed.", ProblemTypes.ValidationFailed);

        return Ok(result);
    }

    // idempotency-posture: operator-documented-safe-retry
    [HttpPost("{patternId:guid}/deprecate")]
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    [MutatingAuditExcluded("Remediation pattern deprecation transitions version status only.")]
    public async Task<IActionResult> Deprecate(
        Guid patternId,
        [FromBody] RemediationPatternVersionActionRequest? request,
        CancellationToken cancellationToken = default)
    {
        if (request is null || string.IsNullOrWhiteSpace(request.Version))
            return this.BadRequestProblem("Version is required.", ProblemTypes.ValidationFailed);

        ScopeContext scope = scopeProvider.GetCurrentScope();

        RemediationPatternOperationResult result = await patternService.DeprecateAsync(
            scope,
            patternId,
            request.Version,
            actorContext.GetActorId(),
            cancellationToken);

        if (!result.Succeeded)
            return this.BadRequestProblem(result.ErrorMessage ?? "Deprecation failed.", ProblemTypes.ValidationFailed);

        return Ok(result);
    }

    // idempotency-posture: operator-documented-safe-retry
    [HttpPost("{patternId:guid}/retire")]
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    [MutatingAuditExcluded("Remediation pattern retirement transitions version status only.")]
    public async Task<IActionResult> Retire(
        Guid patternId,
        [FromBody] RemediationPatternVersionActionRequest? request,
        CancellationToken cancellationToken = default)
    {
        if (request is null || string.IsNullOrWhiteSpace(request.Version))
            return this.BadRequestProblem("Version is required.", ProblemTypes.ValidationFailed);

        ScopeContext scope = scopeProvider.GetCurrentScope();

        RemediationPatternOperationResult result = await patternService.RetireAsync(
            scope,
            patternId,
            request.Version,
            actorContext.GetActorId(),
            cancellationToken);

        if (!result.Succeeded)
            return this.BadRequestProblem(result.ErrorMessage ?? "Retirement failed.", ProblemTypes.ValidationFailed);

        return Ok(result);
    }

    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<RemediationPatternRecord>), StatusCodes.Status200OK)]
    public async Task<IActionResult> List(CancellationToken cancellationToken = default)
    {
        ScopeContext scope = scopeProvider.GetCurrentScope();
        IReadOnlyList<RemediationPatternRecord> patterns = await patternService.ListPatternsAsync(scope, cancellationToken);
        return Ok(patterns);
    }

    [HttpGet("{patternId:guid}")]
    [ProducesResponseType(typeof(RemediationPatternDetailResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetDetail(Guid patternId, CancellationToken cancellationToken = default)
    {
        ScopeContext scope = scopeProvider.GetCurrentScope();

        RemediationPatternDetailResult result = await patternService.TryGetDetailAsync(scope, patternId, cancellationToken);

        if (!result.Succeeded || result.Pattern is null)
            return this.NotFoundProblem(result.ErrorMessage ?? "Remediation pattern was not found.", ProblemTypes.ResourceNotFound);

        return Ok(result);
    }

    // idempotency-posture: operator-documented-safe-retry
    [HttpPost("import/yaml")]
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    [MutatingAuditExcluded("Remediation pattern YAML import creates Draft versions.")]
    public async Task<IActionResult> ImportYaml(
        [FromBody] RemediationPatternImportYamlRequest? request,
        CancellationToken cancellationToken = default)
    {
        if (request is null || string.IsNullOrWhiteSpace(request.Yaml))
            return this.BadRequestProblem("YAML content is required.", ProblemTypes.ValidationFailed);

        ScopeContext scope = scopeProvider.GetCurrentScope();

        RemediationPatternImportResult result = await patternService.ImportFromYamlAsync(
            scope,
            request.Yaml,
            actorContext.GetActorId(),
            cancellationToken);

        if (!result.Succeeded)
            return this.BadRequestProblem(result.ErrorMessage ?? "YAML import failed.", ProblemTypes.ValidationFailed);

        return Ok(result);
    }

    // idempotency-posture: operator-documented-safe-retry
    [HttpPost("import/json")]
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    [MutatingAuditExcluded("Remediation pattern JSON import creates Draft versions.")]
    public async Task<IActionResult> ImportJson(
        [FromBody] RemediationPatternImportJsonRequest? request,
        CancellationToken cancellationToken = default)
    {
        if (request is null || string.IsNullOrWhiteSpace(request.Json))
            return this.BadRequestProblem("JSON content is required.", ProblemTypes.ValidationFailed);

        ScopeContext scope = scopeProvider.GetCurrentScope();

        RemediationPatternImportResult result = await patternService.ImportFromJsonAsync(
            scope,
            request.Json,
            actorContext.GetActorId(),
            cancellationToken);

        if (!result.Succeeded)
            return this.BadRequestProblem(result.ErrorMessage ?? "JSON import failed.", ProblemTypes.ValidationFailed);

        return Ok(result);
    }

    // idempotency-posture: operator-documented-safe-retry
    [HttpPost("import/bulk")]
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    [MutatingAuditExcluded("Remediation pattern bulk import reports per-item errors.")]
    public async Task<IActionResult> ImportBulk(
        [FromBody] RemediationPatternBulkImportRequest? request,
        CancellationToken cancellationToken = default)
    {
        if (request is null || request.Items.Count == 0)
            return this.BadRequestProblem("At least one pattern item is required.", ProblemTypes.ValidationFailed);

        ScopeContext scope = scopeProvider.GetCurrentScope();

        RemediationPatternBulkImportResult result = await patternService.ImportBulkAsync(
            scope,
            request.Items.Select(MapDraftRequest).ToList(),
            actorContext.GetActorId(),
            cancellationToken);

        return Ok(result);
    }

    private static RemediationPatternDraftRequest MapDraftRequest(RemediationPatternDraftApiRequest request) =>
        new()
        {
            PatternKey = request.PatternKey,
            DisplayName = request.DisplayName,
            Description = request.Description,
            Version = request.Version,
            Content = request.Content,
            MatchCriteria = request.MatchCriteria,
            AutomationLevel = request.AutomationLevel,
        };
}
