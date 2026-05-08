using ArchLucid.Contracts.Requests;

namespace ArchLucid.Application.Runs.Orchestration;

/// <summary>
///     Heuristic precheck only — does not replace a full LLM content-safety service. Blocks high-signal
///     instruction-override phrases common in prompt-injection attempts (substring + curated regex families).
/// </summary>
public sealed class DefaultRequestContentSafetyPrecheck : IRequestContentSafetyPrecheck
{
    public Task<RequestContentSafetyResult> EvaluateAsync(ArchitectureRequest request,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);
        cancellationToken.ThrowIfCancellationRequested();

        List<string> reasons = [];

        PromptInjectionPatternSignals.AccumulateForField(request.Description, nameof(request.Description), reasons);
        PromptInjectionPatternSignals.AccumulateForField(request.SystemName, nameof(request.SystemName), reasons);

        foreach (string req in request.InlineRequirements)

            PromptInjectionPatternSignals.AccumulateForField(req, nameof(request.InlineRequirements), reasons);

        foreach (ContextDocumentRequest doc in request.Documents)
        {
            PromptInjectionPatternSignals.AccumulateForField(
                doc.Name,
                $"{nameof(request.Documents)}.{nameof(ContextDocumentRequest.Name)}",
                reasons);

            PromptInjectionPatternSignals.AccumulateForField(
                doc.Content,
                $"{nameof(request.Documents)}.{nameof(ContextDocumentRequest.Content)}",
                reasons);
        }

        return Task.FromResult(new RequestContentSafetyResult { IsAllowed = reasons.Count == 0, Reasons = reasons });
    }
}
