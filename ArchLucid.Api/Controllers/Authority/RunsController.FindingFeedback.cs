using ArchLucid.Api.Models;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Feedback;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Queries;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Authority;

public sealed partial class RunsController
{
    /// <summary>Append-only thumbs feedback for one finding (maps to <c>dbo.FindingFeedback</c>).</summary>
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    [HttpPost("finding/{findingId}/feedback")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> PostFindingFeedbackAsync(
        string findingId,
        [FromBody] ArchitectureFindingFeedbackPostRequest? request,
        CancellationToken cancellationToken)
    {
        if (request is null)
            return this.BadRequestProblem("Request body is required.", ProblemTypes.RequestBodyRequired);

        if (string.IsNullOrWhiteSpace(findingId))
            return this.BadRequestProblem("Finding id is required.", ProblemTypes.ValidationFailed);

        if (request.RunId == Guid.Empty)
            return this.BadRequestProblem("Run id is required.", ProblemTypes.ValidationFailed);

        string? comment = request.Comment?.Trim();

        if (comment is { Length: > 2000 })
            return this.BadRequestProblem("Comment exceeds maximum length (2000).", ProblemTypes.ValidationFailed);

        ScopeContext scope = scopeContextProvider.GetCurrentScope();
        RunDetailDto? detail = await authorityQuery.GetRunDetailAsync(scope, request.RunId, cancellationToken);

        if (detail?.FindingsSnapshot?.Findings is not { Count: > 0 } list)
        {
            return this.NotFoundProblem(
                $"Run '{request.RunId}' has no findings snapshot in the current scope.",
                ProblemTypes.RunNotFound);
        }

        string trimmedFindingId = findingId.Trim();
        bool found = list.Any(f => string.Equals(f.FindingId, trimmedFindingId, StringComparison.OrdinalIgnoreCase));

        if (!found)
        {
            return this.NotFoundProblem(
                $"Finding '{trimmedFindingId}' was not found on run '{request.RunId}'.",
                ProblemTypes.ResourceNotFound);
        }

        short score = request.IsHelpful ? (short)1 : (short)-1;

        FindingFeedbackSubmission submission = new()
        {
            TenantId = scope.TenantId,
            WorkspaceId = scope.WorkspaceId,
            ProjectId = scope.ProjectId,
            RunId = request.RunId,
            FindingId = trimmedFindingId,
            Score = score,
            Comment = string.IsNullOrWhiteSpace(comment) ? null : comment
        };

        await findingFeedbackRepository.InsertAsync(submission, cancellationToken);

        logger.LogInformation(
            "Finding feedback recorded for run {RunId} finding {FindingId} score {Score}.",
            request.RunId,
            trimmedFindingId,
            score);

        return NoContent();
    }
}
