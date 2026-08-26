using System.Text.Json;

using ArchLucid.Api.Models.Tenancy;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application;
using ArchLucid.Application.OperatorHome;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Data.Repositories;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Tenancy;

/// <summary>Workspace homepage settings — featured completed sample for the explore path.</summary>
[ApiController]
[Authorize]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/tenant/homepage-settings")]
public sealed class TenantHomepageSettingsController(
    IFeaturedCompletedSampleService featuredCompletedSampleService,
    IScopeContextProvider scopeProvider,
    IAuditService auditService,
    ITenantRepository tenantRepository) : ControllerBase
{
    private readonly IFeaturedCompletedSampleService _featuredCompletedSampleService =
        featuredCompletedSampleService ?? throw new ArgumentNullException(nameof(featuredCompletedSampleService));

    private readonly IScopeContextProvider _scopeProvider =
        scopeProvider ?? throw new ArgumentNullException(nameof(scopeProvider));

    private readonly IAuditService _auditService =
        auditService ?? throw new ArgumentNullException(nameof(auditService));

    private readonly ITenantRepository _tenantRepository =
        tenantRepository ?? throw new ArgumentNullException(nameof(tenantRepository));

    [HttpGet]
    [Authorize(Policy = ArchLucidPolicies.ReadAuthority)]
    [ProducesResponseType(typeof(TenantHomepageSettingsGetResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetAsync(CancellationToken cancellationToken)
    {
        ScopeContext scope = _scopeProvider.GetCurrentScope();
        TenantRecord? tenant = await _tenantRepository.GetByIdAsync(scope.TenantId, cancellationToken).ConfigureAwait(false);

        if (tenant is null)
            return this.NotFoundProblem("Tenant not found.", ProblemTypes.ResourceNotFound);

        FeaturedCompletedSampleSnapshot snapshot =
            await _featuredCompletedSampleService.GetSnapshotAsync(cancellationToken).ConfigureAwait(false);

        return Ok(ProjectResponse(snapshot));
    }

    [HttpGet("eligible-samples")]
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    [ProducesResponseType(typeof(IReadOnlyList<FeaturedCompletedSampleCandidateResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ListEligibleSamplesAsync(CancellationToken cancellationToken)
    {
        ScopeContext scope = _scopeProvider.GetCurrentScope();
        TenantRecord? tenant = await _tenantRepository.GetByIdAsync(scope.TenantId, cancellationToken).ConfigureAwait(false);

        if (tenant is null)
            return this.NotFoundProblem("Tenant not found.", ProblemTypes.ResourceNotFound);

        IReadOnlyList<FeaturedCompletedSampleCandidate> candidates =
            await _featuredCompletedSampleService.ListEligibleCandidatesAsync(cancellationToken).ConfigureAwait(false);

        FeaturedCompletedSampleCandidateResponse[] response = candidates
            .Select(static candidate => new FeaturedCompletedSampleCandidateResponse
            {
                RunId = candidate.RunId,
                ReviewTitle = candidate.ReviewTitle,
                ArchitectureName = candidate.ArchitectureName,
                CompletedUtc = candidate.CompletedUtc,
                IsSampleApproved = candidate.IsSampleApproved,
            })
            .ToArray();

        return Ok(response);
    }

    [HttpPut]
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    [ProducesResponseType(typeof(TenantHomepageSettingsGetResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> PutAsync(
        [FromBody] TenantHomepageSettingsPutRequest? body,
        CancellationToken cancellationToken)
    {
        if (body is null)
        {
            return this.BadRequestProblem("Request body is required.", ProblemTypes.RequestBodyRequired);
        }

        ScopeContext scope = _scopeProvider.GetCurrentScope();
        string actor = User?.Identity?.Name ?? "operator";
        FeaturedCompletedSampleSnapshot snapshot;

        if (!body.SelectedRunId.HasValue)
        {
            snapshot = await _featuredCompletedSampleService.ClearSelectionAsync(cancellationToken).ConfigureAwait(false);

            await _auditService.LogAsync(
                new AuditEvent
                {
                    EventType = AuditEventTypes.TenantHomepageSettingsUpdated,
                    ActorUserId = actor,
                    ActorUserName = actor,
                    TenantId = scope.TenantId,
                    WorkspaceId = scope.WorkspaceId,
                    ProjectId = scope.ProjectId,
                    DataJson = JsonSerializer.Serialize(new { selectedRunId = (Guid?)null, cleared = true }),
                },
                cancellationToken).ConfigureAwait(false);

            return Ok(ProjectResponse(snapshot));
        }

        try
        {
            snapshot = await _featuredCompletedSampleService
                .SetSelectedRunIdAsync(body.SelectedRunId.Value, cancellationToken)
                .ConfigureAwait(false);
        }
        catch (RunNotFoundException ex)
        {
            return this.NotFoundProblem(ex.Message, ProblemTypes.RunNotFound);
        }
        catch (InvalidOperationException ex)
        {
            return this.BadRequestProblem(ex.Message, ProblemTypes.ValidationFailed);
        }

        await _auditService.LogAsync(
            new AuditEvent
            {
                EventType = AuditEventTypes.TenantHomepageSettingsUpdated,
                ActorUserId = actor,
                ActorUserName = actor,
                TenantId = scope.TenantId,
                WorkspaceId = scope.WorkspaceId,
                ProjectId = scope.ProjectId,
                DataJson = JsonSerializer.Serialize(
                    new
                    {
                        selectedRunId = snapshot.SelectedRunId,
                        isAvailable = snapshot.IsAvailable,
                        isSampleApproved = snapshot.IsSampleApproved,
                    }),
            },
            cancellationToken).ConfigureAwait(false);

        return Ok(ProjectResponse(snapshot));
    }

    private static TenantHomepageSettingsGetResponse ProjectResponse(FeaturedCompletedSampleSnapshot snapshot)
    {
        return new TenantHomepageSettingsGetResponse
        {
            SelectedRunId = snapshot.SelectedRunId,
            IsConfigured = snapshot.IsConfigured,
            IsAvailable = snapshot.IsAvailable,
            ReviewTitle = snapshot.ReviewTitle,
            ArchitectureName = snapshot.ArchitectureName,
            CompletedUtc = snapshot.CompletedUtc,
            IsSampleApproved = snapshot.IsSampleApproved,
        };
    }
}
