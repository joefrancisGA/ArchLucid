using ArchLucid.ArtifactSynthesis.Layout;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence.SecureNowQuestionDispositions;

internal static class SecureNowQuestionDisplayCopy
{
    private const string InferredConnectionReason =
        "SecureNow inferred a connection and needs a person to confirm it before recording it.";

    private const string GenericNoResourceReason =
        "SecureNow needs an answer before it can record this.";

    private const string InferredConnectionFallbackQuestion =
        "Should SecureNow record this inferred connection?";

    internal static SecureNowQuestionRecord WithResourceIdentity(
        SecureNowQuestionRecord question,
        string? armResourceType,
        string resourceArmId)
    {
        string resourceName = ReadDisplayResourceName(resourceArmId);
        string resourceType = armResourceType?.Trim() ?? string.Empty;

        if (question.Source == SecureNowQuestionSource.InferredConnection)
        {
            return question with
            {
                ResourceType = resourceType,
                ResourceName = resourceName,
                QuestionText = FormatInferredQuestionText(question.QuestionText, resourceName),
                ReasonText = InferredConnectionReason,
            };
        }

        if (string.Equals(question.QuestionKey, "orphan-still-needed@v1", StringComparison.OrdinalIgnoreCase))
        {
            return question with
            {
                ResourceType = resourceType,
                ResourceName = resourceName,
                QuestionText = $"Is {resourceName} still needed?",
                ReasonText = $"SecureNow could not find the parent {resourceName} requires.",
            };
        }

        if (string.Equals(question.QuestionKey, "unknown-evidence@v1", StringComparison.OrdinalIgnoreCase))
        {
            string friendlyType = DiagramArmTypeFriendlyName.TryFormat(resourceType) ?? "This type";
            return question with
            {
                ResourceType = resourceType,
                ResourceName = resourceName,
                QuestionText = $"Should {resourceName} connect to a peer, or stand alone?",
                ReasonText =
                    $"SecureNow found no connection to or from {resourceName}. {friendlyType} is not treated as a shared service that can stand alone.",
            };
        }

        return question with
        {
            ResourceType = resourceType,
            ResourceName = resourceName,
            ReasonText = string.IsNullOrWhiteSpace(question.ReasonText)
                ? GenericNoResourceReason
                : question.ReasonText,
        };
    }

    internal static SecureNowQuestionRecord WithNoResourceIdentity(SecureNowQuestionRecord question) =>
        question with
        {
            ResourceType = string.Empty,
            ResourceName = string.Empty,
            ReasonText = string.IsNullOrWhiteSpace(question.ReasonText)
                ? GenericNoResourceReason
                : question.ReasonText,
        };

    private static string FormatInferredQuestionText(string? questionText, string resourceName)
    {
        string trimmed = questionText?.Trim() ?? string.Empty;

        if (trimmed.Length > 0
            && !string.Equals(trimmed, InferredConnectionFallbackQuestion, StringComparison.Ordinal))
        {
            return trimmed;
        }

        if (resourceName.Length == 0)
            return trimmed.Length > 0 ? trimmed : InferredConnectionFallbackQuestion;

        return $"Should SecureNow record an inferred connection for {resourceName}?";
    }

    internal static string ReadDisplayResourceName(string armResourceId)
    {
        string trimmed = armResourceId.Trim();

        if (trimmed.Length == 0)
            return string.Empty;

        string[] segments = trimmed.Split('/', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
        string lastSegment = segments.Length > 0 ? segments[^1] : trimmed;

        return lastSegment.ToLowerInvariant();
    }
}
