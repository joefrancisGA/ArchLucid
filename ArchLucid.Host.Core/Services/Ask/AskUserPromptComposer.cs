using System.Text;

using ArchLucid.AgentRuntime.PromptInjection;

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
        string question)
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
                question));

        return sb.ToString();
    }

    private static void AppendAskCustomerContentBody(
        StringBuilder body,
        string contextJson,
        string? retrievalContext,
        bool retrievalDegraded,
        string? historyText,
        string question)
    {
        body.AppendLine("Structured Context:");
        body.AppendLine(CustomerContentPromptDelimiters.EscapeEmbeddedMarkers(contextJson));
        body.AppendLine();
        body.AppendLine("Retrieved Evidence:");
        body.AppendLine(
            string.IsNullOrWhiteSpace(retrievalContext)
                ? "(none)"
                : CustomerContentPromptDelimiters.EscapeEmbeddedMarkers(retrievalContext));

        if (retrievalDegraded)
        {
            body.AppendLine();
            body.AppendLine("Retrieval Warning:");
            body.AppendLine(
                "Vector search was unavailable; retrieved evidence may be incomplete and was sourced from SQL findings/manifest text only.");
        }

        body.AppendLine();
        body.AppendLine("Conversation History:");
        body.AppendLine(
            string.IsNullOrWhiteSpace(historyText)
                ? "(none)"
                : CustomerContentPromptDelimiters.EscapeEmbeddedMarkers(historyText));
        body.AppendLine();
        body.AppendLine("User Question:");
        body.AppendLine(CustomerContentPromptDelimiters.EscapeEmbeddedMarkers(question ?? string.Empty));
    }
}
