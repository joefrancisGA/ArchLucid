using ArchLucid.Core.InfraEvidence;

namespace ArchLucid.Persistence.InfraEvidence;

public interface ISecurityCrosswalkService
{
    Task<SecurityCrosswalkUpsertResult> UpsertMappingsAsync(
        Guid tenantId,
        IReadOnlyList<SecurityCrosswalkMappingWriteRequest> mappings,
        CancellationToken cancellationToken = default);

    Task<SecurityCrosswalkResolveResult> ResolveEvaluationMappingsAsync(
        Guid tenantId,
        SecurityCrosswalkEndpointKind sourceEndpointKind,
        string sourceEndpointId,
        string expectedVersion,
        CancellationToken cancellationToken = default);

    Task<SecurityCrosswalkUpsertResult> ImportPackRuleHintsAsync(
        Guid tenantId,
        string policyRuleId,
        string packVersion,
        IReadOnlyList<SecurityCrosswalkPackFrameworkMappingHint> frameworkMappings,
        CancellationToken cancellationToken = default);
}

public sealed class SecurityCrosswalkPackFrameworkMappingHint
{
    public string Framework
    {
        get;
        init;
    } = string.Empty;

    public string? Control
    {
        get;
        init;
    }

    public string? Requirement
    {
        get;
        init;
    }

    public string? Theme
    {
        get;
        init;
    }

    public string? Note
    {
        get;
        init;
    }
}
