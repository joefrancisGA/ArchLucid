using System.Text;

using ArchLucid.AgentRuntime.PromptInjection;
using ArchLucid.Application.Ask;

namespace ArchLucid.Host.Core.Services.Ask;

/// <summary>
///     Composes Ask user prompts with static prefix outside customer DATA quarantine (TB-681 / TB-949).
/// </summary>
internal static class AskUserPromptComposer
{
    internal static string BuildUserPrompt(
        string contextJson,
        string? retrievalContext,
        bool retrievalDegraded,
        string? historyText,
        string question,
        IReadOnlyList<AskCitedFindingsSemanticSupportBandHonesty.FindingBandIndexEntry>? findingBandIndex = null)
    {
        StringBuilder sb = new();
        sb.Append(AskUserPromptStaticPrefix.ArchitectUserPrefix);

        CustomerContentPromptDelimiters.AppendQuarantinedSection(
            sb,
            body => AppendAskCustomerContentBody(
                body,
                contextJson,
                retrievalContext,
                retrievalDegraded,
                historyText,
                question,
                findingBandIndex));

        return sb.ToString();
    }

    private static void AppendAskCustomerContentBody(
        StringBuilder body,
        string contextJson,
        string? retrievalContext,
        bool retrievalDegraded,
        string? historyText,
        string question,
        IReadOnlyList<AskCitedFindingsSemanticSupportBandHonesty.FindingBandIndexEntry>? findingBandIndex)
    {
        body.AppendLine("Structured Context:");
        body.AppendLine(CustomerContentPromptDelimiters.EscapeEmbeddedMarkers(contextJson));
        body.AppendLine();

        string? scopeMetadataNote = AskWorkloadScopeMetadataHonesty.BuildPromptNote(contextJson);

        if (!string.IsNullOrWhiteSpace(scopeMetadataNote))
        {
            body.AppendLine(scopeMetadataNote);
            body.AppendLine();
        }

        string semanticSupportConstraint =
            AskCitedFindingsSemanticSupportBandHonesty.BuildPromptConstraintSection(findingBandIndex ?? []);

        if (semanticSupportConstraint.Length > 0)
        {
            body.AppendLine(semanticSupportConstraint);
        }

        body.AppendLine("Retrieved Evidence:");
        body.AppendLine(FormatRetrievedEvidenceSection(retrievalContext));

        if (retrievalDegraded)
        {
            body.AppendLine();
            body.AppendLine("Retrieval Warning:");
            body.AppendLine(
                "Vector search was unavailable; retrieved evidence may be incomplete and was sourced from SQL findings/manifest text only.");
        }

        body.AppendLine();
        body.AppendLine("Conversation History:");
        body.AppendLine(FormatConversationHistorySection(historyText));
        body.AppendLine();
        body.AppendLine("User Question:");
        body.AppendLine(CustomerContentPromptDelimiters.EscapeEmbeddedMarkers(question ?? string.Empty));
    }

    private static string FormatRetrievedEvidenceSection(string? retrievalContext)
    {
        if (retrievalContext is null)
        {
            return "Retrieved evidence was not stored.";
        }

        if (retrievalContext.Length == 0)
        {
            return "Retrieved evidence was not stored.";
        }

        return string.IsNullOrWhiteSpace(retrievalContext)
            ? "Retrieved evidence was stored empty."
            : CustomerContentPromptDelimiters.EscapeEmbeddedMarkers(retrievalContext);
    }

    private static string FormatConversationHistorySection(string? historyText)
    {
        if (historyText is null)
        {
            return "Conversation history was not stored.";
        }

        if (historyText.Length == 0)
        {
            return "Conversation history was not stored.";
        }

        return string.IsNullOrWhiteSpace(historyText)
            ? "Conversation history was stored empty."
            : CustomerContentPromptDelimiters.EscapeEmbeddedMarkers(historyText);
    }
}
