namespace ArchLucid.Capabilities.Cost;

/// <summary>Default RI/SP provider until Azure Billing reservation APIs are integrated.</summary>
public sealed class StubReservationCoverageProvider : IReservationCoverageProvider
{
    /// <inheritdoc />
    public Task<decimal> GetCoverageAsync(string resourceId, CancellationToken cancellationToken = default)
    {
        _ = resourceId;
        cancellationToken.ThrowIfCancellationRequested();

        return Task.FromResult(0m);
    }
}
