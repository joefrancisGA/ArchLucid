namespace ArchLucid.Capabilities.Cost;

/// <summary>
///     Reserved Instance (RI) and Savings Plan (SP) coverage for a cloud resource when estimating ROI savings.
/// </summary>
public interface IReservationCoverageProvider
{
    /// <summary>Returns RI/SP coverage percentage (0–100) for the given ARM resource id.</summary>
    Task<decimal> GetCoverageAsync(string resourceId, CancellationToken cancellationToken = default);
}
