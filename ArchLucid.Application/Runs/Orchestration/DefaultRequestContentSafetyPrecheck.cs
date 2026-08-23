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
        PromptInjectionPatternSignals.AccumulateForField(request.Environment, nameof(request.Environment), reasons);
        PromptInjectionPatternSignals.AccumulateForField(
            request.QualityAttributeSnapshot,
            nameof(request.QualityAttributeSnapshot),
            reasons);
        PromptInjectionPatternSignals.AccumulateForField(
            request.FailureModeNoteSnapshot,
            nameof(request.FailureModeNoteSnapshot),
            reasons);

        foreach (string req in request.InlineRequirements)
            PromptInjectionPatternSignals.AccumulateForField(req, nameof(request.InlineRequirements), reasons);

        foreach (string constraint in request.Constraints)
            PromptInjectionPatternSignals.AccumulateForField(constraint, nameof(request.Constraints), reasons);

        foreach (string capability in request.RequiredCapabilities)
            PromptInjectionPatternSignals.AccumulateForField(capability, nameof(request.RequiredCapabilities), reasons);

        foreach (string assumption in request.Assumptions)
            PromptInjectionPatternSignals.AccumulateForField(assumption, nameof(request.Assumptions), reasons);

        foreach (string policyReference in request.PolicyReferences)
            PromptInjectionPatternSignals.AccumulateForField(policyReference, nameof(request.PolicyReferences), reasons);

        foreach (string topologyHint in request.TopologyHints)
            PromptInjectionPatternSignals.AccumulateForField(topologyHint, nameof(request.TopologyHints), reasons);

        foreach (string securityHint in request.SecurityBaselineHints)
            PromptInjectionPatternSignals.AccumulateForField(securityHint, nameof(request.SecurityBaselineHints), reasons);

        foreach (KeyValuePair<string, string> answer in request.IntakeQuestionAnswers)
        {
            PromptInjectionPatternSignals.AccumulateForField(
                answer.Value,
                $"{nameof(request.IntakeQuestionAnswers)}[{answer.Key}]",
                reasons);
        }

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
