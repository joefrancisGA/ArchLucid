using ArchLucid.Application.Common;
using ArchLucid.Contracts.Requests;

namespace ArchLucid.Application.Runs.Orchestration;

/// <summary>
///     Fast, cheap semantic admission gate that evaluates initial free-text input.
///     Rejects or redirects input that is not related to software architecture.
/// </summary>
public sealed class LlmSemanticAdmissionGate : IRequestContentSafetyPrecheck
{
    public Task<RequestContentSafetyResult> EvaluateAsync(ArchitectureRequest request,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);
        cancellationToken.ThrowIfCancellationRequested();

        List<string> reasons = [];

        if (!string.IsNullOrWhiteSpace(request.Description)
            && !ArchitectureDomainAdmissionPattern.IsMatch(request.Description))
        {
            reasons.Add("REJECT-AS-WRITTEN: The request description does not appear to be related to software architecture. Please provide more context about the system, components, or architectural constraints.");
        }

        return Task.FromResult(new RequestContentSafetyResult { IsAllowed = reasons.Count == 0, Reasons = reasons });
    }
}
