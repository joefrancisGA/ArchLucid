using ArchLucid.Contracts.Requests;

namespace ArchLucid.Application.Planning;

/// <summary>
/// On-demand plain-English explanations for structured-brief suggestion chips during intake.
/// </summary>
public interface IStructuredBriefSuggestionExplainService
{
    Task<ExplainStructuredBriefSuggestionResponse> ExplainAsync(
        ExplainStructuredBriefSuggestionInput input,
        CancellationToken cancellationToken);
}
