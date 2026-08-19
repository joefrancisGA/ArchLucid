using ArchLucid.Contracts.Requests;
using System.Text.RegularExpressions;

namespace ArchLucid.Application.Runs.Orchestration;

/// <summary>
///     Fast, cheap semantic admission gate that evaluates initial free-text input.
///     Rejects or redirects input that is not related to software architecture.
/// </summary>
public sealed class LlmSemanticAdmissionGate : IRequestContentSafetyPrecheck
{
    // A simple heuristic regex to check for architecture-related terms before invoking an LLM.
    // In a full implementation, this would call a fast/cheap LLM (e.g., GPT-4o-mini or Haiku)
    // to evaluate domain fit.
    private static readonly Regex ArchitectureDomainRegex = new(
        @"(?i)\b(architecture|system|database|api|service|cloud|azure|aws|gcp|security|compliance|tenant|scale|latency|throughput|auth|identity)\b",
        RegexOptions.Compiled);

    public Task<RequestContentSafetyResult> EvaluateAsync(ArchitectureRequest request,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);
        cancellationToken.ThrowIfCancellationRequested();

        List<string> reasons = [];

        // Check if the description contains any architecture-related terms.
        if (!string.IsNullOrWhiteSpace(request.Description) && !ArchitectureDomainRegex.IsMatch(request.Description))
        {
            reasons.Add("REJECT-AS-WRITTEN: The request description does not appear to be related to software architecture. Please provide more context about the system, components, or architectural constraints.");
        }

        return Task.FromResult(new RequestContentSafetyResult { IsAllowed = reasons.Count == 0, Reasons = reasons });
    }
}
