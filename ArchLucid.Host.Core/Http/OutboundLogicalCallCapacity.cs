using System.Net;

using Polly;

namespace ArchLucid.Host.Core.Http;

/// <summary>Bounds concurrent logical calls without counting local saturation as a provider failure.</summary>
internal sealed class OutboundLogicalCallCapacity(int maxCalls, string rejectionReason) : ResilienceStrategy<HttpResponseMessage>
{
    private int _activeCalls;

    protected override async ValueTask<Outcome<HttpResponseMessage>> ExecuteCore<TState>(
        Func<ResilienceContext, TState, ValueTask<Outcome<HttpResponseMessage>>> callback,
        ResilienceContext context,
        TState state)
    {
        context.CancellationToken.ThrowIfCancellationRequested();
        int activeCalls = Interlocked.Increment(ref _activeCalls);

        try
        {
            if (activeCalls > maxCalls)
            {
                return Outcome.FromResult(new HttpResponseMessage(HttpStatusCode.ServiceUnavailable)
                {
                    ReasonPhrase = rejectionReason,
                });
            }

            return await callback(context, state).ConfigureAwait(false);
        }
        finally
        {
            Interlocked.Decrement(ref _activeCalls);
        }
    }
}
