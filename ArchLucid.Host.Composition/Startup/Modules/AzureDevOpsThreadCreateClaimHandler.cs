using System.Net;

using ArchLucid.Core.Integration;
using ArchLucid.Core.Scoping;
using ArchLucid.Integrations.AzureDevOps;

namespace ArchLucid.Host.Composition.Startup.Modules;

/// <summary>Reserves an admitted thread POST immediately before handing it to the transport.</summary>
internal sealed class AzureDevOpsThreadCreateClaimHandler(
    IServiceScopeFactory scopeFactory,
    ILogger<AzureDevOpsThreadCreateClaimHandler> logger) : DelegatingHandler
{
    protected override async Task<HttpResponseMessage> SendAsync(
        HttpRequestMessage request,
        CancellationToken cancellationToken)
    {
        if (request.Method != HttpMethod.Post ||
            !request.Options.TryGetValue(AzureDevOpsPullRequestDecorator.ThreadCreateClaimOption, out AzureDevOpsThreadCreateClaim claim) ||
            claim.TenantId == Guid.Empty || claim.RunId == Guid.Empty ||
            claim.RepositoryId == Guid.Empty || claim.PullRequestId <= 0)
        {
            throw new InvalidOperationException("Azure DevOps thread creation requires a valid tenant, run, repository and pull request claim.");
        }

        if (!await TryClaimAsync(claim, cancellationToken).ConfigureAwait(false))
        {
            if (logger.IsEnabled(LogLevel.Debug))
            {
                logger.LogDebug(
                    "Azure DevOps thread POST skipped for RunId={RunId}, RepositoryId={RepositoryId}, PullRequestId={PullRequestId}. A prior attempt owns the claim.",
                    claim.RunId, claim.RepositoryId, claim.PullRequestId);
            }

            // This local no-op is not confirmation of a remote comment.
            return new HttpResponseMessage(HttpStatusCode.NoContent) { RequestMessage = request };
        }

        return await base.SendAsync(request, cancellationToken).ConfigureAwait(false);
    }

    private async Task<bool> TryClaimAsync(AzureDevOpsThreadCreateClaim claim, CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();
        ScopeContext? current = AmbientScopeContext.CurrentOverride;
        if (current is not null && current.TenantId != Guid.Empty && current.TenantId != claim.TenantId)
            throw new InvalidOperationException("Azure DevOps thread claim does not match the active tenant.");

        using IDisposable tenantScope = AmbientScopeContext.Push(new ScopeContext { TenantId = claim.TenantId });
        await using AsyncServiceScope scope = scopeFactory.CreateAsyncScope();
        IAzureDevOpsThreadCreateClaimStore store =
            scope.ServiceProvider.GetRequiredService<IAzureDevOpsThreadCreateClaimStore>();

        return await store.TryClaimAsync(claim, cancellationToken).ConfigureAwait(false);
    }
}
