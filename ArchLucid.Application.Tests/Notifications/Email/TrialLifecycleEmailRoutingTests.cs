using ArchLucid.Application.Notifications.Email;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Notifications.Email;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class TrialLifecycleEmailRoutingTests
{
    private static readonly Guid TenantId = Guid.Parse("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee");

    [Theory]
    [InlineData(TrialLifecycleEmailTrigger.TrialProvisioned, EmailTemplateIds.TrialWelcome)]
    [InlineData(TrialLifecycleEmailTrigger.FirstRunCommitted, EmailTemplateIds.TrialFirstRunComplete)]
    [InlineData(TrialLifecycleEmailTrigger.MidTrialDay7, EmailTemplateIds.TrialMidTrialDay7)]
    [InlineData(TrialLifecycleEmailTrigger.ApproachingRunLimit, EmailTemplateIds.TrialApproachingRunLimit)]
    [InlineData(TrialLifecycleEmailTrigger.ExpiringSoon, EmailTemplateIds.TrialExpiringSoon)]
    [InlineData(TrialLifecycleEmailTrigger.Expired, EmailTemplateIds.TrialExpired)]
    [InlineData(TrialLifecycleEmailTrigger.Converted, EmailTemplateIds.TrialConverted)]
    public void Idempotency_key_embeds_expected_template_token(TrialLifecycleEmailTrigger trigger, string templateId)
    {
        string key = TrialEmailIdempotencyKeys.ForTrigger(trigger, TenantId);

        key.Should().Be($"trial-email|{TenantId:N}|{templateId}");
    }
}
