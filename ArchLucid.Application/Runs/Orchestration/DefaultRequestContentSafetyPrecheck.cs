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

        ArchitectureRequestAgentReachableStringPaths.ScanAll(request, reasons);

        return Task.FromResult(new RequestContentSafetyResult { IsAllowed = reasons.Count == 0, Reasons = reasons });
    }
}
