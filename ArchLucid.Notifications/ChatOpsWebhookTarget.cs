namespace ArchLucid.Notifications;

/// <summary>Outbound chat notification transport for generic ChatOps payloads (incoming webhooks).</summary>
public enum ChatOpsWebhookTarget
{
    Slack = 0,

    Teams = 1,
}
