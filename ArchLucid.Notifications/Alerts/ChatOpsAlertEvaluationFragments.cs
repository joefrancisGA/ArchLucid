using System.Net;

namespace ArchLucid.Notifications.Alerts;

/// <summary>Formats alert category/trigger copy for Slack and Teams incoming webhooks.</summary>
internal static class ChatOpsAlertEvaluationFragments
{
    public static string BuildSlackCategoryTriggerParagraph(string category, string triggerValue)
    {
        ArgumentNullException.ThrowIfNull(category);
        ArgumentNullException.ThrowIfNull(triggerValue);

        string safeCategory = ChatOpsWebhookUserFragments.SanitizeUserLine(category);
        string safeTrigger = ChatOpsWebhookUserFragments.SanitizeUserLine(triggerValue);

        return $"Category: {safeCategory}\nTrigger: {safeTrigger}";
    }

    public static string BuildTeamsCategoryTriggerParagraph(string category, string triggerValue)
    {
        ArgumentNullException.ThrowIfNull(category);
        ArgumentNullException.ThrowIfNull(triggerValue);

        string safeCategory = WebUtility.HtmlEncode(ChatOpsWebhookUserFragments.SanitizeUserLine(category));
        string safeTrigger = WebUtility.HtmlEncode(ChatOpsWebhookUserFragments.SanitizeUserLine(triggerValue));

        return $"Category: {safeCategory}\nTrigger: {safeTrigger}";
    }
}