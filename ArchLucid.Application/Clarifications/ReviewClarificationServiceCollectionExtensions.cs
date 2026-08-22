using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace ArchLucid.Application.Clarifications;

internal static class ReviewClarificationServiceCollectionExtensions
{
    internal static IServiceCollection AddReviewClarificationQuestions(this IServiceCollection services)
    {
        ArgumentNullException.ThrowIfNull(services);

        services.TryAddEnumerable(ServiceDescriptor.Singleton<IReviewClarificationRule, RequiredCapabilityCoverageClarificationRule>());
        services.TryAddEnumerable(ServiceDescriptor.Singleton<IReviewClarificationRule, TopologyCoverageClarificationRule>());
        services.TryAddEnumerable(ServiceDescriptor.Singleton<IReviewClarificationRule, PolicyCoverageClarificationRule>());
        services.TryAddEnumerable(ServiceDescriptor.Singleton<IReviewClarificationRule, SecurityCoverageClarificationRule>());
        services.TryAddEnumerable(ServiceDescriptor.Singleton<IReviewClarificationRule, SecurityBaselineCompletenessClarificationRule>());
        services.TryAddEnumerable(ServiceDescriptor.Singleton<IReviewClarificationRule, PolicyApplicabilityClarificationRule>());

        services.TryAddSingleton<ReviewClarificationQuestionDeriver>();
        services.TryAddSingleton<ReviewClarificationDeltaComputer>();
        services.TryAddScoped<IReviewClarificationQuestionService, ReviewClarificationQuestionService>();

        return services;
    }
}
