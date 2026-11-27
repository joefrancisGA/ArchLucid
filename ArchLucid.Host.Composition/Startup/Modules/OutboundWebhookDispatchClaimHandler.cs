using System.Net;

using ArchLucid.Core.Integration;
using ArchLucid.Core.Scoping;
using ArchLucid.Host.Core.Services.Delivery;

namespace ArchLucid.Host.Composition.Startup.Modules;

/// <summary>Records a one-shot event reservation after admission and before any network send.</summary>
internal sealed class OutboundWebhookDispatchClaimHandler(
    IServiceScopeFactory scopeFactory,
    ILogger<OutboundWebhookDispatchClaimHandler> logger) : DelegatingHandler
{
    protected override async Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
    {
        if (!request.Options.TryGetValue(HttpWebhookPoster.DispatchClaimOption, out OutboundWebhookDispatchClaim claim))
            return await base.SendAsync(request, cancellationToken).ConfigureAwait(false);

        if (request.Method != HttpMethod.Post || claim.TenantId == Guid.Empty || claim.EventId == Guid.Empty)
            throw new InvalidOperationException("Invalid outbound webhook dispatch claim.");

        if (await TryClaimAsync(claim, cancellationToken).ConfigureAwait(false))
            return await base.SendAsync(request, cancellationToken).ConfigureAwait(false);

        request.Options.Set(HttpWebhookPoster.DispatchSuppressedOption, true);

        if (logger.IsEnabled(LogLevel.Debug))
            logger.LogDebug("An outbound webhook dispatch was skipped because its event already has a reservation.");

        // The response is local and deliberately excluded from the poster's delivery metrics.
        return new HttpResponseMessage(HttpStatusCode.NoContent) { RequestMessage = request };
    }

    private async Task<bool> TryClaimAsync(OutboundWebhookDispatchClaim claim, CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();
        ScopeContext? current = AmbientScopeContext.CurrentOverride;

        if (current is not null && current.TenantId != Guid.Empty && current.TenantId != claim.TenantId)
            throw new InvalidOperationException("Outbound webhook dispatch claim does not match the active tenant.");

        using IDisposable tenantScope = AmbientScopeContext.Push(new ScopeContext { TenantId = claim.TenantId });
        await using AsyncServiceScope scope = scopeFactory.CreateAsyncScope();
        IOutboundWebhookDispatchClaimStore store =
            scope.ServiceProvider.GetRequiredService<IOutboundWebhookDispatchClaimStore>();

        return await store.TryClaimAsync(claim, cancellationToken).ConfigureAwait(false);
    }
}
