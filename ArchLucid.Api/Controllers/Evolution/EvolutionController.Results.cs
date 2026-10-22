using ArchLucid.Api.Models.Evolution;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Api.ProductLearning;
using ArchLucid.Api.Services.Evolution;
using ArchLucid.Contracts.Evolution;
using ArchLucid.Contracts.ProductLearning;
using ArchLucid.Core.Authorization;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Evolution;

public sealed partial class EvolutionController
{
    [HttpGet("results/{candidateId:guid}")]
    [Authorize(Policy = ArchLucidPolicies.ReadAuthority)]
    [ProducesResponseType(typeof(EvolutionResultsResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetResults(Guid candidateId, CancellationToken cancellationToken)
    {
        ProductLearningScope scope = ToProductLearningScope(scopeProvider.GetCurrentScope());

        EvolutionResultsResponse? body =
            await evolutionApplicationFacade.TryBuildResultsResponseAsync(candidateId, scope, cancellationToken);

        if (body is null)
            return this.NotFoundProblem(
                $"Candidate change set '{candidateId}' was not found in the current scope.",
                ProblemTypes.EvolutionCandidateChangeSetNotFound);

        return Ok(body);
    }

    [HttpGet("results/{candidateId:guid}/export")]
    [Authorize(Policy = ArchLucidPolicies.ReadAuthority)]
    [ProducesResponseType(typeof(FileContentResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ExportResults(
        Guid candidateId,
        [FromQuery] string? format,
        CancellationToken cancellationToken)
    {
        if (!ProductLearningQueryParser.TryParseReportFormat(format, out string formatNorm, out string? formatError))
            return this.BadRequestProblem(formatError!, ProblemTypes.ValidationFailed);

        ProductLearningScope scope = ToProductLearningScope(scopeProvider.GetCurrentScope());

        EvolutionExportResults? export =
            await evolutionApplicationFacade.TryBuildExportResultsAsync(
                candidateId,
                formatNorm,
                scope,
                cancellationToken);

        if (export is null)
            return this.NotFoundProblem(
                $"Candidate change set '{candidateId}' was not found in the current scope.",
                ProblemTypes.EvolutionCandidateChangeSetNotFound);

        return ApiFileResults.RangeText(Request, export.Content, export.ContentType, export.FileName);
    }
}
