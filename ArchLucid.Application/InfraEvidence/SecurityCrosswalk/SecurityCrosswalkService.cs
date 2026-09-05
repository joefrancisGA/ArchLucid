using ArchLucid.Core.InfraEvidence;
using ArchLucid.Persistence.InfraEvidence;

using Microsoft.Extensions.Logging;

namespace ArchLucid.Application.InfraEvidence.SecurityCrosswalk;

public sealed class SecurityCrosswalkService(
    ISecurityCrosswalkRepository repository,
    ILogger<SecurityCrosswalkService> logger) : ISecurityCrosswalkService
{
    public async Task<SecurityCrosswalkUpsertResult> UpsertMappingsAsync(
        Guid tenantId,
        IReadOnlyList<SecurityCrosswalkMappingWriteRequest> mappings,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(mappings);

        if (mappings.Count == 0)
        {
            return new SecurityCrosswalkUpsertResult
            {
                Succeeded = true,
                Mappings = [],
            };
        }

        DateTime utcNow = TimeProvider.System.UtcNowDateTime();
        List<SecurityCrosswalkMappingRecord> records = [];

        foreach (SecurityCrosswalkMappingWriteRequest mapping in mappings)
        {
            if (!SecurityCrosswalkMappingGuard.TryValidateWrite(mapping, out string? errorMessage))
            {
                return new SecurityCrosswalkUpsertResult
                {
                    Succeeded = false,
                    ErrorMessage = errorMessage,
                };
            }

            records.Add(new SecurityCrosswalkMappingRecord
            {
                MappingId = Guid.NewGuid(),
                TenantId = tenantId,
                SourceEndpointKind = mapping.SourceEndpointKind,
                SourceEndpointId = mapping.SourceEndpointId.Trim(),
                TargetEndpointKind = mapping.TargetEndpointKind,
                TargetEndpointId = mapping.TargetEndpointId.Trim(),
                MappingType = mapping.MappingType,
                Confidence = mapping.Confidence,
                MappingSource = mapping.MappingSource,
                Version = mapping.Version.Trim(),
                Rationale = mapping.Rationale,
                HumanVerified = mapping.HumanVerified,
                CreatedUtc = utcNow,
                UpdatedUtc = utcNow,
            });
        }

        IReadOnlyList<SecurityCrosswalkMappingRecord> inserted =
            await repository.InsertManyAsync(records, cancellationToken);

        return new SecurityCrosswalkUpsertResult
        {
            Succeeded = true,
            Mappings = inserted,
        };
    }

    public async Task<SecurityCrosswalkResolveResult> ResolveEvaluationMappingsAsync(
        Guid tenantId,
        SecurityCrosswalkEndpointKind sourceEndpointKind,
        string sourceEndpointId,
        string expectedVersion,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(sourceEndpointId) || string.IsNullOrWhiteSpace(expectedVersion))
        {
            return new SecurityCrosswalkResolveResult
            {
                RejectionReasons = ["Source endpoint id and expected version are required."],
            };
        }

        IReadOnlyList<SecurityCrosswalkMappingRecord> mappings = await repository.ListBySourceAsync(
            tenantId,
            sourceEndpointKind,
            sourceEndpointId.Trim(),
            cancellationToken);

        List<SecurityCrosswalkMappingRecord> eligible = [];
        List<string> rejections = [];

        foreach (SecurityCrosswalkMappingRecord mapping in mappings)
        {
            if (SecurityCrosswalkMappingGuard.IsEligibleForEvaluation(mapping, expectedVersion, out string? rejectionReason))
            {
                eligible.Add(mapping);
                continue;
            }

            if (!string.IsNullOrWhiteSpace(rejectionReason))
                rejections.Add(rejectionReason);
        }

        return new SecurityCrosswalkResolveResult
        {
            EvaluationEligibleMappings = eligible,
            RejectionReasons = rejections.Distinct(StringComparer.Ordinal).ToList(),
        };
    }

    public async Task<SecurityCrosswalkUpsertResult> ImportPackRuleHintsAsync(
        Guid tenantId,
        string policyRuleId,
        string packVersion,
        IReadOnlyList<SecurityCrosswalkPackFrameworkMappingHint> frameworkMappings,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(frameworkMappings);

        if (string.IsNullOrWhiteSpace(policyRuleId) || string.IsNullOrWhiteSpace(packVersion))
        {
            return new SecurityCrosswalkUpsertResult
            {
                Succeeded = false,
                ErrorMessage = "Policy rule id and pack version are required.",
            };
        }

        List<SecurityCrosswalkMappingWriteRequest> writes = [];

        foreach (SecurityCrosswalkPackFrameworkMappingHint hint in frameworkMappings)
        {
            string? targetControlId = ResolvePackTargetControlId(hint);

            if (string.IsNullOrWhiteSpace(targetControlId))
                continue;

            writes.Add(new SecurityCrosswalkMappingWriteRequest
            {
                SourceEndpointKind = SecurityCrosswalkEndpointKind.ArchitecturePolicyRule,
                SourceEndpointId = policyRuleId.Trim(),
                TargetEndpointKind = SecurityCrosswalkEndpointKind.McsbControl,
                TargetEndpointId = targetControlId,
                MappingType = SecurityCrosswalkMappingType.Related,
                Confidence = 0.85m,
                MappingSource = SecurityCrosswalkMappingSource.VendorPublished,
                Version = packVersion.Trim(),
                Rationale = BuildPackHintRationale(hint),
                HumanVerified = false,
            });
        }

        if (writes.Count == 0)
        {
            logger.LogInformation(
                "No deterministic pack crosswalk hints imported for PolicyRuleId={PolicyRuleId}.",
                policyRuleId);

            return new SecurityCrosswalkUpsertResult
            {
                Succeeded = true,
                Mappings = [],
            };
        }

        return await UpsertMappingsAsync(tenantId, writes, cancellationToken);
    }

    private static string? ResolvePackTargetControlId(SecurityCrosswalkPackFrameworkMappingHint hint)
    {
        if (!string.IsNullOrWhiteSpace(hint.Control))
            return $"{hint.Framework}:{hint.Control}".Trim(':');

        if (!string.IsNullOrWhiteSpace(hint.Requirement))
            return $"{hint.Framework}:{hint.Requirement}".Trim(':');

        if (!string.IsNullOrWhiteSpace(hint.Theme))
            return $"{hint.Framework}:{hint.Theme}".Trim(':');

        return null;
    }

    private static string BuildPackHintRationale(SecurityCrosswalkPackFrameworkMappingHint hint)
    {
        if (!string.IsNullOrWhiteSpace(hint.Note))
            return hint.Note;

        return $"Vendor-published thematic mapping from policy pack ({hint.Framework}).";
    }
}
