using ArchLucid.Contracts.Abstractions.Integrations;

namespace ArchLucid.Integrations.AzureDevOps;

/// <summary>
///     Creates a fresh <see cref="IAzureDevOpsPullRequestDecorator" /> per integration-event handling so singleton
///     handlers do not capture transient typed <see cref="HttpClient" /> instances.
/// </summary>
public interface IAzureDevOpsPullRequestDecoratorFactory
{
    IAzureDevOpsPullRequestDecorator Create();
}
