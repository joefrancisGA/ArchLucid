namespace ArchLucid.Core.Findings;

/// <summary>Merges host <see cref="InsightDensityGateOptions" /> with per-tenant <c>dbo.TenantSettings</c> overrides.</summary>
public interface IInsightDensityGateOptionsResolver
{
    InsightDensityGateOptions Resolve(CancellationToken cancellationToken = default);
}
