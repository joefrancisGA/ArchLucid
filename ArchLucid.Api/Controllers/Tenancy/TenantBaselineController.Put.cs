using System.Text.Json;

using ArchLucid.Api.Models.Tenancy;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Contracts.ValueReports;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Tenancy;

public sealed partial class TenantBaselineController
{
    [HttpPut]
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    [ProducesResponseType(typeof(TenantBaselineGetResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> PutAsync(
        [FromBody] TenantBaselinePutRequest? body,
        CancellationToken cancellationToken)
    {
        if (body is null)
            return this.BadRequestProblem("Request body is required.", ProblemTypes.RequestBodyRequired);

        if (body.ManualPrepHoursPerReview is <= 0m or > 10_000m)
        {
            return this.BadRequestProblem(
                "Manual preparation hours per review must be between 0 and 10,000 (exclusive of zero) when set.",
                ProblemTypes.ValidationFailed);
        }

        if (body.PeoplePerReview is <= 0 or > 10_000)
        {
            return this.BadRequestProblem(
                "People involved per review must be between 1 and 10,000 when set.",
                ProblemTypes.ValidationFailed);
        }

        if (body.BaselineReviewCycleHours is <= 0m or > 10_000m)
        {
            return this.BadRequestProblem(
                "Baseline review-cycle hours must be between 0 and 10,000 (exclusive of zero) when set.",
                ProblemTypes.ValidationFailed);
        }

        if (!string.IsNullOrWhiteSpace(body.BaselineReviewCycleSourceNote)
            && body.BaselineReviewCycleSourceNote.Trim().Length > BaselineReviewCycleSourceMarkers.MaxOperatorSettingsNoteLength)
        {
            return this.BadRequestProblem(
                $"Baseline review-cycle source note must be {BaselineReviewCycleSourceMarkers.MaxOperatorSettingsNoteLength} characters or fewer.",
                ProblemTypes.ValidationFailed);
        }

        if (body.BaselineReviewCycleSourceNote is not null
            && string.IsNullOrWhiteSpace(body.BaselineReviewCycleSourceNote))
        {
            return this.BadRequestProblem(
                "Baseline review-cycle source note cannot be empty or whitespace.",
                ProblemTypes.ValidationFailed);
        }

        ScopeContext scope = _scopeProvider.GetCurrentScope();
        TenantRecord? existing = await _tenantRepository.GetByIdAsync(scope.TenantId, cancellationToken);

        if (existing is null)
            return this.NotFoundProblem("Tenant not found.", ProblemTypes.ResourceNotFound);

        bool touchManual = body.ManualPrepHoursPerReview.HasValue || body.PeoplePerReview.HasValue;
        bool touchReview = body.BaselineReviewCycleHours.HasValue;
        bool touchReviewSourceNote =
            body.BaselineReviewCycleSourceNote is not null && existing.BaselineReviewCycleHours.HasValue;

        if (body.BaselineReviewCycleSourceNote is not null
            && !existing.BaselineReviewCycleHours.HasValue
            && !body.BaselineReviewCycleHours.HasValue)
        {
            return this.BadRequestProblem(
                "Baseline review-cycle hours must be captured before a source note can be updated.",
                ProblemTypes.ValidationFailed);
        }

        if (!touchManual && !touchReview && !touchReviewSourceNote)
            return Ok(ProjectBaselineResponse(existing));

        string actor = User.Identity?.Name ?? "operator";

        if (touchManual)
        {
            decimal? prep = body.ManualPrepHoursPerReview ?? existing.BaselineManualPrepHoursPerReview;
            int? people = body.PeoplePerReview ?? existing.BaselinePeoplePerReview;

            if (prep is null)
            {
                return this.BadRequestProblem(
                    "Manual preparation hours per review must be set before people involved per review can be captured.",
                    ProblemTypes.ValidationFailed);
            }

            if (prep is <= 0m or > 10_000m)
            {
                return this.BadRequestProblem(
                    "Manual preparation hours per review must be between 0 and 10,000 (exclusive of zero).",
                    ProblemTypes.ValidationFailed);
            }

            if (people is <= 0 or > 10_000)
            {
                return this.BadRequestProblem(
                    "People involved per review must be between 1 and 10,000.",
                    ProblemTypes.ValidationFailed);
            }

            bool firstManualCapture = existing.BaselineManualPrepCapturedUtc is null;
            DateTimeOffset captured = TimeProvider.System.GetUtcNow();
            bool isIdenticalManualRetry = existing.BaselineManualPrepCapturedUtc is not null
                && existing.BaselineManualPrepHoursPerReview == prep
                && existing.BaselinePeoplePerReview == people;

            await _tenantRepository.UpdateBaselineAsync(scope.TenantId, prep, people, captured, cancellationToken);
            ArchLucidInstrumentation.RecordBaselineManualPrepCaptured();

            if (!isIdenticalManualRetry)
            {
                await _auditService.LogAsync(
                new AuditEvent
                {
                    EventType = firstManualCapture
                        ? AuditEventTypes.TrialBaselineManualPrepCaptured
                        : AuditEventTypes.TrialBaselineManualPrepUpdated,
                    ActorUserId = actor,
                    ActorUserName = actor,
                    TenantId = scope.TenantId,
                    WorkspaceId = scope.WorkspaceId,
                    ProjectId = scope.ProjectId,
                    DataJson = JsonSerializer.Serialize(
                        new { manualPrepHoursPerReview = prep, peoplePerReview = people, capturedUtc = captured })
                },
                cancellationToken);
            }
        }

        if (touchReview)
        {
            decimal hours = body.BaselineReviewCycleHours!.Value;
            string persistedSource = body.BaselineReviewCycleSourceNote is not null
                ? BaselineReviewCycleSourceMarkers.FormatOperatorSettingsPersistence(body.BaselineReviewCycleSourceNote)
                : existing.BaselineReviewCycleSource
                    ?? BaselineReviewCycleSourceMarkers.FormatOperatorSettingsPersistence(null);

            DateTimeOffset capturedUtc = TimeProvider.System.GetUtcNow();
            bool firstReviewCycleCapture = existing.BaselineReviewCycleCapturedUtc is null;
            bool isIdenticalReviewRetry = existing.BaselineReviewCycleCapturedUtc is not null
                && existing.BaselineReviewCycleHours == hours
                && string.Equals(existing.BaselineReviewCycleSource, persistedSource, StringComparison.OrdinalIgnoreCase);

            await _tenantRepository.PersistTrialSignupBaselineReviewCycleAsync(
                scope.TenantId,
                hours,
                persistedSource,
                capturedUtc,
                cancellationToken);

            if (!isIdenticalReviewRetry)
            {
                await _auditService.LogAsync(
                new AuditEvent
                {
                    EventType = firstReviewCycleCapture
                        ? AuditEventTypes.TrialBaselineReviewCycleCaptured
                        : AuditEventTypes.TrialBaselineReviewCycleUpdated,
                    ActorUserId = actor,
                    ActorUserName = actor,
                    TenantId = scope.TenantId,
                    WorkspaceId = scope.WorkspaceId,
                    ProjectId = scope.ProjectId,
                    DataJson = JsonSerializer.Serialize(
                        new
                        {
                            baselineReviewCycleHours = hours,
                            baselineReviewCycleSource = persistedSource,
                            capturedUtc = capturedUtc
                        })
                },
                cancellationToken);
            }
        }
        else if (touchReviewSourceNote)
        {
            decimal hours = existing.BaselineReviewCycleHours!.Value;
            string persistedSource =
                BaselineReviewCycleSourceMarkers.FormatOperatorSettingsPersistence(body.BaselineReviewCycleSourceNote);
            DateTimeOffset capturedUtc = existing.BaselineReviewCycleCapturedUtc ?? TimeProvider.System.GetUtcNow();

            await _tenantRepository.PersistTrialSignupBaselineReviewCycleAsync(
                scope.TenantId,
                hours,
                persistedSource,
                capturedUtc,
                cancellationToken);

            bool isIdenticalSourceNoteRetry = string.Equals(
                existing.BaselineReviewCycleSource,
                persistedSource,
                StringComparison.OrdinalIgnoreCase);

            if (!isIdenticalSourceNoteRetry)
            {
                await _auditService.LogAsync(
                new AuditEvent
                {
                    EventType = AuditEventTypes.TrialBaselineReviewCycleUpdated,
                    ActorUserId = actor,
                    ActorUserName = actor,
                    TenantId = scope.TenantId,
                    WorkspaceId = scope.WorkspaceId,
                    ProjectId = scope.ProjectId,
                    DataJson = JsonSerializer.Serialize(
                        new
                        {
                            baselineReviewCycleHours = hours,
                            baselineReviewCycleSource = persistedSource,
                            capturedUtc = capturedUtc
                        })
                },
                cancellationToken);
            }
        }

        TenantRecord? readBack = await _tenantRepository.GetByIdAsync(scope.TenantId, cancellationToken);

        return Ok(ProjectBaselineResponse(readBack ?? existing));
    }
}
