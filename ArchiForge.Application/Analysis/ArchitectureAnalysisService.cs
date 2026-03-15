using ArchiForge.Application.Determinism;
using ArchiForge.Application.Diffs;
using ArchiForge.Application.Diagrams;
using ArchiForge.Application.Summaries;
using ArchiForge.Data.Repositories;

namespace ArchiForge.Application.Analysis;

public sealed class ArchitectureAnalysisService : IArchitectureAnalysisService
{
    private readonly IArchitectureRunRepository _runRepository;
    private readonly IGoldenManifestRepository _manifestRepository;
    private readonly IAgentEvidencePackageRepository _evidenceRepository;
    private readonly IAgentExecutionTraceRepository _traceRepository;
    private readonly IAgentResultRepository _resultRepository;
    private readonly IDiagramGenerator _diagramGenerator;
    private readonly IManifestSummaryGenerator _summaryGenerator;
    private readonly IDeterminismCheckService _determinismCheckService;
    private readonly IManifestDiffService _manifestDiffService;
    private readonly IAgentResultDiffService _agentResultDiffService;

    public ArchitectureAnalysisService(
        IArchitectureRunRepository runRepository,
        IGoldenManifestRepository manifestRepository,
        IAgentEvidencePackageRepository evidenceRepository,
        IAgentExecutionTraceRepository traceRepository,
        IAgentResultRepository resultRepository,
        IDiagramGenerator diagramGenerator,
        IManifestSummaryGenerator summaryGenerator,
        IDeterminismCheckService determinismCheckService,
        IManifestDiffService manifestDiffService,
        IAgentResultDiffService agentResultDiffService)
    {
        _runRepository = runRepository;
        _manifestRepository = manifestRepository;
        _evidenceRepository = evidenceRepository;
        _traceRepository = traceRepository;
        _resultRepository = resultRepository;
        _diagramGenerator = diagramGenerator;
        _summaryGenerator = summaryGenerator;
        _determinismCheckService = determinismCheckService;
        _manifestDiffService = manifestDiffService;
        _agentResultDiffService = agentResultDiffService;
    }

    public async Task<ArchitectureAnalysisReport> BuildAsync(
        ArchitectureAnalysisRequest request,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(request.RunId))
        {
            throw new InvalidOperationException("RunId is required.");
        }

        var run = await _runRepository.GetByIdAsync(request.RunId, cancellationToken)
            ?? throw new InvalidOperationException($"Run '{request.RunId}' not found.");

        var report = new ArchitectureAnalysisReport
        {
            Run = run
        };

        if (request.IncludeEvidence)
        {
            report.Evidence = await _evidenceRepository.GetByRunIdAsync(request.RunId, cancellationToken);
            if (report.Evidence is null)
            {
                report.Warnings.Add("Evidence package was not found for this run.");
            }
        }

        if (request.IncludeExecutionTraces)
        {
            report.ExecutionTraces = (await _traceRepository.GetByRunIdAsync(request.RunId, cancellationToken)).ToList();
            if (report.ExecutionTraces.Count == 0)
            {
                report.Warnings.Add("No execution traces were found for this run.");
            }
        }

        if (request.IncludeManifest && !string.IsNullOrWhiteSpace(run.CurrentManifestVersion))
        {
            report.Manifest = await _manifestRepository.GetByVersionAsync(run.CurrentManifestVersion!, cancellationToken);
            if (report.Manifest is null)
            {
                report.Warnings.Add($"Manifest '{run.CurrentManifestVersion}' was not found.");
            }
        }

        if (request.IncludeDiagram && report.Manifest is not null)
        {
            report.Diagram = _diagramGenerator.GenerateMermaid(report.Manifest);
        }

        if (request.IncludeSummary && report.Manifest is not null)
        {
            report.Summary = _summaryGenerator.GenerateMarkdown(report.Manifest, report.Evidence);
        }

        if (request.IncludeDeterminismCheck)
        {
            report.Determinism = await _determinismCheckService.RunAsync(
                new DeterminismCheckRequest
                {
                    RunId = request.RunId,
                    Iterations = request.DeterminismIterations,
                    ExecutionMode = "Current",
                    CommitReplays = false
                },
                cancellationToken);
        }

        if (request.IncludeManifestCompare)
        {
            if (string.IsNullOrWhiteSpace(request.CompareManifestVersion))
            {
                report.Warnings.Add("Manifest comparison was requested but CompareManifestVersion was not provided.");
            }
            else if (report.Manifest is null)
            {
                report.Warnings.Add("Manifest comparison was requested but the primary manifest is not available.");
            }
            else
            {
                var compareManifest = await _manifestRepository.GetByVersionAsync(
                    request.CompareManifestVersion,
                    cancellationToken);

                if (compareManifest is null)
                {
                    report.Warnings.Add($"Compare manifest '{request.CompareManifestVersion}' was not found.");
                }
                else
                {
                    report.ManifestDiff = _manifestDiffService.Compare(report.Manifest, compareManifest);
                }
            }
        }

        if (request.IncludeAgentResultCompare)
        {
            if (string.IsNullOrWhiteSpace(request.CompareRunId))
            {
                report.Warnings.Add("Agent-result comparison was requested but CompareRunId was not provided.");
            }
            else
            {
                var compareRun = await _runRepository.GetByIdAsync(request.CompareRunId, cancellationToken);

                if (compareRun is null)
                {
                    report.Warnings.Add($"Compare run '{request.CompareRunId}' was not found.");
                }
                else
                {
                    var leftResults = await _resultRepository.GetByRunIdAsync(request.RunId, cancellationToken);
                    var rightResults = await _resultRepository.GetByRunIdAsync(request.CompareRunId, cancellationToken);

                    report.AgentResultDiff = _agentResultDiffService.Compare(
                        request.RunId,
                        leftResults,
                        request.CompareRunId,
                        rightResults);
                }
            }
        }

        return report;
    }
}
