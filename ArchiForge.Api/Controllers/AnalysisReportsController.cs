using ArchiForge.Api.Models;
using ArchiForge.Api.ProblemDetails;
using ArchiForge.Api.Services;
using ArchiForge.Api.Jobs;
using ArchiForge.Application.Analysis;
using ArchiForge.Data.Repositories;
using Asp.Versioning;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

using ApiConsultingDocxProfileRecommendationRequest =
    ArchiForge.Api.Models.ConsultingDocxProfileRecommendationRequest;
using AppConsultingDocxProfileRecommendationRequest =
    ArchiForge.Application.Analysis.ConsultingDocxProfileRecommendationRequest;
using AppConsultingDocxExportProfileSelector =
    ArchiForge.Application.Analysis.IConsultingDocxExportProfileSelector;

namespace ArchiForge.Api.Controllers;

[ApiController]
[Authorize(AuthenticationSchemes = "ApiKey")]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/architecture")]
[EnableRateLimiting("fixed")]
public sealed class AnalysisReportsController : ControllerBase
{
    private readonly IArchitectureRunRepository _runRepository;
    private readonly IArchitectureAnalysisService _architectureAnalysisService;
    private readonly IArchitectureAnalysisExportService _architectureAnalysisExportService;
    private readonly IArchitectureAnalysisDocxExportService _docxExportService;
    private readonly IArchitectureAnalysisConsultingDocxExportService _architectureAnalysisConsultingDocxExportService;
    private readonly IConsultingDocxTemplateRecommendationService _consultingDocxTemplateRecommendationService;
    private readonly AppConsultingDocxExportProfileSelector _consultingDocxExportProfileSelector;
    private readonly IBackgroundJobQueue _jobs;
    private readonly ILogger<AnalysisReportsController> _logger;

    public AnalysisReportsController(
        IArchitectureRunRepository runRepository,
        IArchitectureAnalysisService architectureAnalysisService,
        IArchitectureAnalysisExportService architectureAnalysisExportService,
        IArchitectureAnalysisDocxExportService docxExportService,
        IArchitectureAnalysisConsultingDocxExportService architectureAnalysisConsultingDocxExportService,
        IConsultingDocxTemplateRecommendationService consultingDocxTemplateRecommendationService,
        AppConsultingDocxExportProfileSelector consultingDocxExportProfileSelector,
        IBackgroundJobQueue jobs,
        ILogger<AnalysisReportsController> logger)
    {
        _runRepository = runRepository;
        _architectureAnalysisService = architectureAnalysisService;
        _architectureAnalysisExportService = architectureAnalysisExportService;
        _docxExportService = docxExportService;
        _architectureAnalysisConsultingDocxExportService = architectureAnalysisConsultingDocxExportService;
        _consultingDocxTemplateRecommendationService = consultingDocxTemplateRecommendationService;
        _consultingDocxExportProfileSelector = consultingDocxExportProfileSelector;
        _jobs = jobs;
        _logger = logger;
    }

    [HttpPost("run/{runId}/analysis-report")]
    [ProducesResponseType(typeof(ArchitectureAnalysisReportResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> AnalyzeRun(
        [FromRoute] string runId,
        [FromBody] ArchitectureAnalysisRequest? request,
        CancellationToken cancellationToken)
    {
        request ??= new ArchitectureAnalysisRequest();
        request.RunId = runId;

        var run = await _runRepository.GetByIdAsync(runId, cancellationToken);
        if (run is null)
        {
            return this.NotFoundProblem($"Run '{runId}' was not found.", ProblemTypes.RunNotFound);
        }

        try
        {
            var report = await _architectureAnalysisService.BuildAsync(request, cancellationToken);
            return Ok(new ArchitectureAnalysisReportResponse { Report = report });
        }
        catch (InvalidOperationException ex)
        {
            return this.BadRequestProblem(ex.Message, ProblemTypes.BadRequest);
        }
    }

    [HttpPost("run/{runId}/analysis-report/export")]
    [ProducesResponseType(typeof(ArchitectureAnalysisExportResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ExportAnalysisReport(
        [FromRoute] string runId,
        [FromBody] ArchitectureAnalysisRequest? request,
        CancellationToken cancellationToken)
    {
        request ??= new ArchitectureAnalysisRequest();
        request.RunId = runId;

        var run = await _runRepository.GetByIdAsync(runId, cancellationToken);
        if (run is null)
        {
            return this.NotFoundProblem($"Run '{runId}' was not found.", ProblemTypes.RunNotFound);
        }

        try
        {
            var report = await _architectureAnalysisService.BuildAsync(request, cancellationToken);
            var markdown = _architectureAnalysisExportService.GenerateMarkdown(report);
            return Ok(new ArchitectureAnalysisExportResponse
            {
                RunId = runId,
                Format = "markdown",
                FileName = $"analysis-report-{runId}.md",
                Content = markdown
            });
        }
        catch (InvalidOperationException ex)
        {
            return this.BadRequestProblem(ex.Message, ProblemTypes.ExportFailed);
        }
    }

    [HttpPost("run/{runId}/analysis-report/export/file")]
    [ProducesResponseType(typeof(FileContentResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DownloadAnalysisReportExport(
        [FromRoute] string runId,
        [FromBody] ArchitectureAnalysisRequest? request,
        CancellationToken cancellationToken)
    {
        request ??= new ArchitectureAnalysisRequest();
        request.RunId = runId;

        var run = await _runRepository.GetByIdAsync(runId, cancellationToken);
        if (run is null)
        {
            return this.NotFoundProblem($"Run '{runId}' was not found.", ProblemTypes.RunNotFound);
        }

        try
        {
            var report = await _architectureAnalysisService.BuildAsync(request, cancellationToken);
            var markdown = _architectureAnalysisExportService.GenerateMarkdown(report);
            var bytes = System.Text.Encoding.UTF8.GetBytes(markdown);
            return File(bytes, "text/markdown", $"analysis-report-{runId}.md");
        }
        catch (InvalidOperationException ex)
        {
            return this.BadRequestProblem(ex.Message, ProblemTypes.ExportFailed);
        }
    }

    [HttpPost("run/{runId}/analysis-report/export/docx")]
    [ProducesResponseType(typeof(FileContentResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DownloadAnalysisReportDocx(
        [FromRoute] string runId,
        [FromBody] ArchitectureAnalysisRequest? request,
        CancellationToken cancellationToken)
    {
        request ??= new ArchitectureAnalysisRequest();
        request.RunId = runId;

        var run = await _runRepository.GetByIdAsync(runId, cancellationToken);
        if (run is null)
        {
            return this.NotFoundProblem($"Run '{runId}' was not found.", ProblemTypes.RunNotFound);
        }

        try
        {
            var bytes = await _docxExportService.GenerateDocxAsync(
                await _architectureAnalysisService.BuildAsync(request, cancellationToken),
                cancellationToken);
            return File(
                bytes,
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                $"analysis-report-{runId}.docx");
        }
        catch (InvalidOperationException ex)
        {
            return this.BadRequestProblem(ex.Message, ProblemTypes.ExportFailed);
        }
    }

    [HttpPost("run/{runId}/analysis-report/export/docx/async")]
    [ProducesResponseType(typeof(AsyncJobResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DownloadAnalysisReportDocxAsync(
        [FromRoute] string runId,
        [FromBody] ArchitectureAnalysisRequest? request,
        CancellationToken cancellationToken)
    {
        request ??= new ArchitectureAnalysisRequest();
        request.RunId = runId;

        var run = await _runRepository.GetByIdAsync(runId, cancellationToken);
        if (run is null)
        {
            return this.NotFoundProblem($"Run '{runId}' was not found.", ProblemTypes.RunNotFound);
        }

        var jobId = _jobs.Enqueue(
            fileNameHint: $"analysis-report-{runId}.docx",
            contentTypeHint: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            work: async ct =>
            {
                var bytes = await _docxExportService.GenerateDocxAsync(
                    await _architectureAnalysisService.BuildAsync(request, ct),
                    ct);
                return new BackgroundJobFile(
                    FileName: $"analysis-report-{runId}.docx",
                    ContentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                    Bytes: bytes);
            });

        return Ok(new AsyncJobResponse { JobId = jobId });
    }

    [HttpPost("analysis-report/export/docx/consulting/resolve-profile")]
    [ProducesResponseType(typeof(ConsultingDocxResolveProfileResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public IActionResult ResolveConsultingDocxProfile(
        [FromBody] ConsultingDocxResolveProfileRequest? request)
    {
        request ??= new ConsultingDocxResolveProfileRequest();

        // TemplateName is currently advisory only; the selector resolves based on the
        // requested profile key and recommendation inputs.
        var resolved = _consultingDocxExportProfileSelector.Resolve(
            request.Profile,
            new ArchiForge.Application.Analysis.ConsultingDocxProfileRecommendationRequest());

        return Ok(new ConsultingDocxResolveProfileResponse
        {
            RequestedProfile = request.Profile,
            RequestedTemplateName = request.TemplateName,
            ResolvedProfile = resolved.SelectedProfileName,
            ResolvedProfileDisplayName = resolved.SelectedProfileDisplayName,
            WasAutoSelected = resolved.WasAutoSelected,
            ResolutionReason = resolved.ResolutionReason
        });
    }

    [HttpPost("run/{runId}/analysis-report/export/docx/consulting")]
    [ProducesResponseType(typeof(FileContentResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DownloadConsultingDocx(
        [FromRoute] string runId,
        [FromBody] ConsultingDocxExportRequest? request,
        CancellationToken cancellationToken)
    {
        request ??= new ConsultingDocxExportRequest();

        var run = await _runRepository.GetByIdAsync(runId, cancellationToken);
        if (run is null)
        {
            return this.NotFoundProblem($"Run '{runId}' was not found.", ProblemTypes.RunNotFound);
        }

        try
        {
            var analysisRequest = new ArchitectureAnalysisRequest
            {
                RunId = runId,
                IncludeEvidence = request.IncludeEvidence,
                IncludeExecutionTraces = request.IncludeExecutionTraces,
                IncludeManifest = request.IncludeManifest,
                IncludeDiagram = request.IncludeDiagram,
                // Consulting template options are currently configured globally via IOptions;
                // the API request influences the analysis content via the Include* flags.
                IncludeSummary = true,
                IncludeDeterminismCheck = request.IncludeDeterminismCheck,
                DeterminismIterations = request.DeterminismIterations,
                IncludeManifestCompare = request.IncludeManifestCompare,
                CompareManifestVersion = request.CompareManifestVersion,
                IncludeAgentResultCompare = request.IncludeAgentResultCompare,
                CompareRunId = request.CompareRunId
            };

            var report = await _architectureAnalysisService.BuildAsync(
                analysisRequest,
                cancellationToken);

            var bytes = await _architectureAnalysisConsultingDocxExportService.GenerateDocxAsync(
                report,
                cancellationToken);

            return File(
                bytes,
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                $"analysis-report-consulting-{runId}.docx");
        }
        catch (InvalidOperationException ex)
        {
            return this.BadRequestProblem(ex.Message, ProblemTypes.ExportFailed);
        }
    }

    [HttpPost("run/{runId}/analysis-report/export/docx/consulting/async")]
    [ProducesResponseType(typeof(AsyncJobResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DownloadConsultingDocxAsync(
        [FromRoute] string runId,
        [FromBody] ConsultingDocxExportRequest? request,
        CancellationToken cancellationToken)
    {
        request ??= new ConsultingDocxExportRequest();

        var run = await _runRepository.GetByIdAsync(runId, cancellationToken);
        if (run is null)
        {
            return this.NotFoundProblem($"Run '{runId}' was not found.", ProblemTypes.RunNotFound);
        }

        var jobId = _jobs.Enqueue(
            fileNameHint: $"analysis-report-consulting-{runId}.docx",
            contentTypeHint: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            work: async ct =>
            {
                var analysisRequest = new ArchitectureAnalysisRequest
                {
                    RunId = runId,
                    IncludeEvidence = request.IncludeEvidence,
                    IncludeExecutionTraces = request.IncludeExecutionTraces,
                    IncludeManifest = request.IncludeManifest,
                    IncludeDiagram = request.IncludeDiagram,
                    IncludeSummary = true,
                    IncludeDeterminismCheck = request.IncludeDeterminismCheck,
                    DeterminismIterations = request.DeterminismIterations,
                    IncludeManifestCompare = request.IncludeManifestCompare,
                    CompareManifestVersion = request.CompareManifestVersion,
                    IncludeAgentResultCompare = request.IncludeAgentResultCompare,
                    CompareRunId = request.CompareRunId
                };

                var report = await _architectureAnalysisService.BuildAsync(
                    analysisRequest,
                    ct);

                var bytes = await _architectureAnalysisConsultingDocxExportService.GenerateDocxAsync(
                    report,
                    ct);
                return new BackgroundJobFile(
                    FileName: $"analysis-report-consulting-{runId}.docx",
                    ContentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                    Bytes: bytes);
            });

        return Ok(new AsyncJobResponse { JobId = jobId });
    }

    [HttpPost("analysis-report/export/docx/consulting/profiles/recommend")]
    [ProducesResponseType(typeof(ConsultingDocxProfileRecommendationResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public IActionResult RecommendConsultingProfiles(
        [FromBody] ApiConsultingDocxProfileRecommendationRequest? request)
    {
        request ??= new ApiConsultingDocxProfileRecommendationRequest();

        var recommendation = _consultingDocxTemplateRecommendationService.Recommend(
            new AppConsultingDocxProfileRecommendationRequest
            {
                Audience = request.Audience,
                ExternalDelivery = request.ExternalDelivery,
                ExecutiveFriendly = request.ExecutiveFriendly,
                RegulatedEnvironment = request.RegulatedEnvironment,
                NeedDetailedEvidence = request.NeedDetailedEvidence,
                NeedExecutionTraces = request.NeedExecutionTraces,
                NeedDeterminismOrCompareAppendices = request.NeedDeterminismOrCompareAppendices
            });

        return Ok(new ConsultingDocxProfileRecommendationResponse
        {
            Recommendation = recommendation
        });
    }
}

