using ArchLucid.Application.Governance;
using ArchLucid.Application.Notifications.Email;
using ArchLucid.Application.Runs;
using ArchLucid.Core.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace ArchLucid.Host.Composition.Startup.Modules;

partial class RunLifecycleOrchestrationCompositionRegistrar
{
    private static void RegisterExportsGovernanceGovernanceNotifications(
        IServiceCollection services,
        IConfiguration configuration)
    {
        services.Configure<RecurrenceCompletionNotificationOptions>(
            configuration.GetSection(RecurrenceCompletionNotificationOptions.SectionName));
        services.AddScoped<IRecurrenceCompletionRecipientResolver, RecurrenceCompletionRecipientResolver>();
        services.AddScoped<IRecurrenceCompletionEmailDispatcher, RecurrenceCompletionEmailDispatcher>();
        services.AddScoped<IFindingRemediationAssignmentEmailDispatcher, FindingRemediationAssignmentEmailDispatcher>();
        services.AddScoped<IRecurrenceCompletionNotificationService, RecurrenceCompletionNotificationService>();
        services.Configure<WaiverExpiryNotificationOptions>(
            configuration.GetSection(WaiverExpiryNotificationOptions.SectionName));
        services.AddScoped<IWaiverExpiryNotificationService, WaiverExpiryNotificationService>();
        services.AddScoped<IReviewsAwaitingActionQueryService, ReviewsAwaitingActionQueryService>();
        services.AddScoped<IRecurringArchitectureReviewTriggerService, RecurringArchitectureReviewTriggerService>();
    }
}
