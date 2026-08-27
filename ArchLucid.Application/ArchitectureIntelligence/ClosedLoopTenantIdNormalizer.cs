namespace ArchLucid.Application.ArchitectureIntelligence;

internal static class ClosedLoopTenantIdNormalizer
{
    public static string NormalizeRequired(string tenantId)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(tenantId);

        return tenantId.Trim();
    }

    public static string? NormalizeOptional(string? tenantId)
    {
        if (string.IsNullOrWhiteSpace(tenantId))
            return null;

        return tenantId.Trim();
    }
}
