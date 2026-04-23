namespace ArchLucid.Application.Pilots;

/// <summary>Builds the operator <c>/why-archlucid</c> measured ROI panel (telemetry + cost context).</summary>
public interface ITenantMeasuredRoiService
{
    Task<TenantMeasuredRoiSummary> GetAsync(Guid tenantId, CancellationToken cancellationToken = default);
}
