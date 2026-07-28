using ArchLucid.Contracts.ArchitectureIntelligence;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;

namespace ArchLucid.Application.ArchitectureIntelligence;

/// <summary>
/// Maps a product authority run → architecture request intake texts for ArchitectureIntelligence.
/// </summary>
public sealed class ArchitectureIntelligenceProductRunSourceContextLoader(
    IScopeContextProvider scopeContextProvider,
    IRunRepository runRepository,
    IArchitectureRequestRepository architectureRequestRepository)
    : IArchitectureIntelligenceProductRunSourceContextLoader
{
    private readonly IScopeContextProvider _scopeContextProvider =
        scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    private readonly IRunRepository _runRepository =
        runRepository ?? throw new ArgumentNullException(nameof(runRepository));

    private readonly IArchitectureRequestRepository _architectureRequestRepository =
        architectureRequestRepository ?? throw new ArgumentNullException(nameof(architectureRequestRepository));

    public async Task<ArchitectureIntelligenceProductRunSourceContextLoadResult> LoadAsync(
        string runId,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(runId))
        {
            return ArchitectureIntelligenceProductRunSourceContextLoadResult.NotFound("RunId is required.");
        }

        if (!Guid.TryParse(runId.Trim(), out Guid runGuid))
        {
            return ArchitectureIntelligenceProductRunSourceContextLoadResult.NotFound(
                $"RunId '{runId}' is not a valid product run identifier.");
        }

        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        RunRecord? run = await _runRepository.GetByIdAsync(scope, runGuid, cancellationToken);

        if (run is null)
        {
            return ArchitectureIntelligenceProductRunSourceContextLoadResult.NotFound(
                $"Product run '{runGuid:D}' was not found in the current scope.");
        }

        ArchitectureRequest? architectureRequest = null;

        if (!string.IsNullOrWhiteSpace(run.ArchitectureRequestId))
        {
            architectureRequest = await _architectureRequestRepository.GetByIdAsync(
                run.ArchitectureRequestId,
                cancellationToken);
        }

        List<ClosedLoopReasoningSourceText> sourceTexts = BuildSourceTexts(run, architectureRequest);

        if (sourceTexts.Count == 0)
        {
            return ArchitectureIntelligenceProductRunSourceContextLoadResult.Empty(
                $"Product run '{runGuid:D}' has no architecture description or document content to load.");
        }

        ClosedLoopReasoningRequest request = new()
        {
            TenantId = scope.TenantId.ToString("D"),
            WorkspaceId = scope.WorkspaceId.ToString("D"),
            ProjectId = scope.ProjectId.ToString("D"),
            RunId = runGuid.ToString("D"),
            SourceTexts = sourceTexts,
            DeclaredPriorities = [],
            ContinueFromExistingRun = false,
            PublishToProduct = false,
        };

        return ArchitectureIntelligenceProductRunSourceContextLoadResult.Success(request);
    }

    private static List<ClosedLoopReasoningSourceText> BuildSourceTexts(
        RunRecord run,
        ArchitectureRequest? architectureRequest)
    {
        List<ClosedLoopReasoningSourceText> sources = [];

        string? description = architectureRequest?.Description;

        if (string.IsNullOrWhiteSpace(description))
        {
            description = run.Description;
        }

        if (!string.IsNullOrWhiteSpace(description))
        {
            sources.Add(new ClosedLoopReasoningSourceText
            {
                FileName = "architecture-description.txt",
                ContentType = "text/plain",
                Content = description.Trim(),
            });
        }

        if (architectureRequest?.InlineRequirements is { Count: > 0 })
        {
            List<string> requirements = architectureRequest.InlineRequirements
                .Where(item => !string.IsNullOrWhiteSpace(item))
                .Select(item => item.Trim())
                .ToList();

            if (requirements.Count > 0)
            {
                sources.Add(new ClosedLoopReasoningSourceText
                {
                    FileName = "inline-requirements.txt",
                    ContentType = "text/plain",
                    Content = string.Join(Environment.NewLine, requirements),
                });
            }
        }

        if (architectureRequest?.Documents is null)
        {
            return sources;
        }

        foreach (ContextDocumentRequest document in architectureRequest.Documents)
        {
            if (document is null || string.IsNullOrWhiteSpace(document.Content))
            {
                continue;
            }

            string fileName = string.IsNullOrWhiteSpace(document.Name)
                ? $"document-{sources.Count + 1}.txt"
                : document.Name.Trim();

            string contentType = string.IsNullOrWhiteSpace(document.ContentType)
                ? "text/plain"
                : document.ContentType.Trim();

            sources.Add(new ClosedLoopReasoningSourceText
            {
                FileName = fileName,
                ContentType = contentType,
                Content = document.Content,
            });
        }

        return sources;
    }
}
