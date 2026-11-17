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
            string idTail = ReadResourceIdTailSegment(resourceArmId);
            string questionText = idTail.Length > 0
                ? $"Resource id ends with {idTail}. A separate display name was not stored. Is this resource still needed?"
                : "Resource name was not stored. Is this resource still needed?";
            return question with
            {
                ResourceType = resourceType,
                ResourceName = resourceName,
                QuestionText = questionText,
                ReasonText = idTail.Length > 0
                    ? $"A parent for {idTail} was not stored."
                    : "Resource name was not stored. A parent was not stored.",
            };
        }

        if (string.Equals(question.QuestionKey, "unknown-evidence@v1", StringComparison.OrdinalIgnoreCase))
        {
            string reasonSuffix = resourceType.Length > 0
                ? $"{DiagramArmTypeFriendlyName.TryFormat(resourceType) ?? resourceType} is not treated as a shared service that can stand alone."
                : "This resource is not treated as a shared service that can stand alone.";
            string reasonPrefix = resourceType.Length > 0
                ? "Connection evidence was not stored."
                : "Resource type was not stored. Connection evidence was not stored.";
            string questionText = resourceName.Length > 0
                ? $"Should {resourceName} connect to a peer, or stand alone?"
                : "Resource name was not stored. Should this resource connect to a peer, or stand alone?";
            return question with
            {
                ResourceType = resourceType,
                ResourceName = resourceName,
                QuestionText = questionText,
                ReasonText = $"{reasonPrefix} {reasonSuffix}",
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
            return "Should SecureNow record this inferred connection without a stored resource name?";

        return $"Should SecureNow record an inferred connection for {resourceName}?";
    }

    internal static string ReadDisplayResourceName(string armResourceId)
    {
        string trimmed = armResourceId.Trim();

        if (trimmed.Length == 0)
            return string.Empty;

        string[] segments = trimmed.Split('/', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
        string lastSegment = segments.Length > 0 ? segments[^1] : trimmed;

        return lastSegment;
    }

    private static string ReadResourceIdTailSegment(string armResourceId)
    {
        string trimmed = armResourceId.Trim();

        if (trimmed.Length == 0)
            return string.Empty;

        string[] segments = trimmed.Split('/', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

        return segments.Length > 0 ? segments[^1] : trimmed;
    }
}
