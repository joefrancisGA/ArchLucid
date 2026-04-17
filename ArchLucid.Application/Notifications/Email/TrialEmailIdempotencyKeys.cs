namespace ArchLucid.Application.Notifications.Email;

public static class TrialEmailIdempotencyKeys
{
    public static string ForTrigger(TrialLifecycleEmailTrigger trigger, Guid tenantId) =>
        trigger switch
        {
            TrialLifecycleEmailTrigger.TrialProvisioned => Welcome(tenantId),
            TrialLifecycleEmailTrigger.FirstRunCommitted => FirstRun(tenantId),
            TrialLifecycleEmailTrigger.MidTrialDay7 => MidTrialDay7(tenantId),
            TrialLifecycleEmailTrigger.ApproachingRunLimit => ApproachingRunLimit(tenantId),
            TrialLifecycleEmailTrigger.ExpiringSoon => ExpiringSoon(tenantId),
            TrialLifecycleEmailTrigger.Expired => Expired(tenantId),
            TrialLifecycleEmailTrigger.Converted => Converted(tenantId),
            _ => throw new ArgumentOutOfRangeException(nameof(trigger), trigger, "Unknown trial lifecycle email trigger."),
        };

    public static string Welcome(Guid tenantId) => $"trial-email|{tenantId:N}|{EmailTemplateIds.TrialWelcome}";

    public static string FirstRun(Guid tenantId) => $"trial-email|{tenantId:N}|{EmailTemplateIds.TrialFirstRunComplete}";

    public static string MidTrialDay7(Guid tenantId) => $"trial-email|{tenantId:N}|{EmailTemplateIds.TrialMidTrialDay7}";

    public static string ApproachingRunLimit(Guid tenantId) => $"trial-email|{tenantId:N}|{EmailTemplateIds.TrialApproachingRunLimit}";

    public static string ExpiringSoon(Guid tenantId) => $"trial-email|{tenantId:N}|{EmailTemplateIds.TrialExpiringSoon}";

    public static string Expired(Guid tenantId) => $"trial-email|{tenantId:N}|{EmailTemplateIds.TrialExpired}";

    public static string Converted(Guid tenantId) => $"trial-email|{tenantId:N}|{EmailTemplateIds.TrialConverted}";
}
