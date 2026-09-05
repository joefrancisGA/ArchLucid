using ArchLucid.Application.InfraEvidence.SecurityCrosswalk;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Persistence.InfraEvidence;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;

namespace ArchLucid.Application.Tests.InfraEvidence;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class SecurityCrosswalkServiceTests
{
    [Fact]
    public async Task UpsertMappingsAsync_many_to_many_insert_returns_all_rows()
    {
        Guid tenantId = Guid.NewGuid();
        InMemorySecurityCrosswalkRepository repository = new();

        SecurityCrosswalkService sut = new(repository, NullLogger<SecurityCrosswalkService>.Instance);

        SecurityCrosswalkUpsertResult result = await sut.UpsertMappingsAsync(
            tenantId,
            [
                CreateWriteRequest("AC-1", "SC-8", SecurityCrosswalkMappingSource.VendorPublished, humanVerified: false),
                CreateWriteRequest("AC-1", "SC-13", SecurityCrosswalkMappingSource.DeterministicallyDerived, humanVerified: false),
            ]);

        result.Succeeded.Should().BeTrue();
        result.Mappings.Should().HaveCount(2);
        repository.StoredMappings.Should().HaveCount(2);
        repository.StoredMappings.Select(mapping => mapping.TargetEndpointId)
            .Should().BeEquivalentTo(["SC-8", "SC-13"]);
    }

    [Fact]
    public async Task ResolveEvaluationMappingsAsync_ai_proposed_is_rejected_for_authoritative_use()
    {
        Guid tenantId = Guid.NewGuid();
        InMemorySecurityCrosswalkRepository repository = new();

        await repository.InsertManyAsync(
        [
            CreateRecord(
                tenantId,
                "AC-2",
                "SC-7",
                SecurityCrosswalkMappingSource.AIProposed,
                version: "1.0.0",
                humanVerified: false),
            CreateRecord(
                tenantId,
                "AC-2",
                "SC-8",
                SecurityCrosswalkMappingSource.VendorPublished,
                version: "1.0.0",
                humanVerified: false),
        ]);

        SecurityCrosswalkService sut = new(repository, NullLogger<SecurityCrosswalkService>.Instance);

        SecurityCrosswalkResolveResult result = await sut.ResolveEvaluationMappingsAsync(
            tenantId,
            SecurityCrosswalkEndpointKind.AuditControl,
            "AC-2",
            "1.0.0");

        result.EvaluationEligibleMappings.Should().ContainSingle();
        result.EvaluationEligibleMappings[0].TargetEndpointId.Should().Be("SC-8");
        result.RejectionReasons.Should().Contain(reason =>
            reason.Contains("AI-proposed", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public async Task ResolveEvaluationMappingsAsync_version_mismatch_invalidates_mapping()
    {
        Guid tenantId = Guid.NewGuid();
        InMemorySecurityCrosswalkRepository repository = new();

        await repository.InsertManyAsync(
        [
            CreateRecord(
                tenantId,
                "AC-3",
                "SC-12",
                SecurityCrosswalkMappingSource.OrganizationDefined,
                version: "1.0.0",
                humanVerified: true),
        ]);

        SecurityCrosswalkService sut = new(repository, NullLogger<SecurityCrosswalkService>.Instance);

        SecurityCrosswalkResolveResult result = await sut.ResolveEvaluationMappingsAsync(
            tenantId,
            SecurityCrosswalkEndpointKind.AuditControl,
            "AC-3",
            "2.0.0");

        result.EvaluationEligibleMappings.Should().BeEmpty();
        result.RejectionReasons.Should().Contain(reason => reason.Contains("version", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public async Task UpsertMappingsAsync_tenant_org_defined_mappings_are_isolated_by_tenant()
    {
        Guid tenantA = Guid.NewGuid();
        Guid tenantB = Guid.NewGuid();
        InMemorySecurityCrosswalkRepository repository = new();
        SecurityCrosswalkService sut = new(repository, NullLogger<SecurityCrosswalkService>.Instance);

        await sut.UpsertMappingsAsync(
            tenantA,
            [
                new SecurityCrosswalkMappingWriteRequest
                {
                    SourceEndpointKind = SecurityCrosswalkEndpointKind.ArchitecturePolicyRule,
                    SourceEndpointId = "rule-a",
                    TargetEndpointKind = SecurityCrosswalkEndpointKind.McsbControl,
                    TargetEndpointId = "SC-28",
                    MappingType = SecurityCrosswalkMappingType.Related,
                    MappingSource = SecurityCrosswalkMappingSource.OrganizationDefined,
                    Version = "1.0.0",
                    Rationale = "tenant a mapping",
                    HumanVerified = true,
                },
            ]);

        await sut.UpsertMappingsAsync(
            tenantB,
            [
                new SecurityCrosswalkMappingWriteRequest
                {
                    SourceEndpointKind = SecurityCrosswalkEndpointKind.ArchitecturePolicyRule,
                    SourceEndpointId = "rule-b",
                    TargetEndpointKind = SecurityCrosswalkEndpointKind.McsbControl,
                    TargetEndpointId = "SC-28",
                    MappingType = SecurityCrosswalkMappingType.Related,
                    MappingSource = SecurityCrosswalkMappingSource.OrganizationDefined,
                    Version = "1.0.0",
                    Rationale = "tenant b mapping",
                    HumanVerified = true,
                },
            ]);

        SecurityCrosswalkResolveResult tenantAResult = await sut.ResolveEvaluationMappingsAsync(
            tenantA,
            SecurityCrosswalkEndpointKind.ArchitecturePolicyRule,
            "rule-a",
            "1.0.0");

        SecurityCrosswalkResolveResult tenantBResult = await sut.ResolveEvaluationMappingsAsync(
            tenantB,
            SecurityCrosswalkEndpointKind.ArchitecturePolicyRule,
            "rule-b",
            "1.0.0");

        tenantAResult.EvaluationEligibleMappings.Should().ContainSingle();
        tenantBResult.EvaluationEligibleMappings.Should().ContainSingle();
        tenantAResult.EvaluationEligibleMappings[0].TenantId.Should().Be(tenantA);
        tenantBResult.EvaluationEligibleMappings[0].TenantId.Should().Be(tenantB);

        SecurityCrosswalkResolveResult crossTenant = await sut.ResolveEvaluationMappingsAsync(
            tenantA,
            SecurityCrosswalkEndpointKind.ArchitecturePolicyRule,
            "rule-b",
            "1.0.0");

        crossTenant.EvaluationEligibleMappings.Should().BeEmpty();
    }

    [Fact]
    public void TryValidateWrite_ai_proposed_cannot_be_human_verified()
    {
        bool valid = SecurityCrosswalkMappingGuard.TryValidateWrite(
            new SecurityCrosswalkMappingWriteRequest
            {
                SourceEndpointKind = SecurityCrosswalkEndpointKind.AuditControl,
                SourceEndpointId = "AC-4",
                TargetEndpointKind = SecurityCrosswalkEndpointKind.McsbControl,
                TargetEndpointId = "SC-1",
                MappingType = SecurityCrosswalkMappingType.Related,
                MappingSource = SecurityCrosswalkMappingSource.AIProposed,
                Version = "1.0.0",
                Rationale = "ai hint",
                HumanVerified = true,
            },
            out string? errorMessage);

        valid.Should().BeFalse();
        errorMessage.Should().Contain("AI-proposed");
    }

    [Fact]
    public async Task ImportPackRuleHintsAsync_creates_vendor_published_edges_from_framework_mappings()
    {
        Guid tenantId = Guid.NewGuid();
        InMemorySecurityCrosswalkRepository repository = new();
        SecurityCrosswalkService sut = new(repository, NullLogger<SecurityCrosswalkService>.Instance);

        SecurityCrosswalkUpsertResult result = await sut.ImportPackRuleHintsAsync(
            tenantId,
            "zta-001",
            "1.0.0",
            [
                new SecurityCrosswalkPackFrameworkMappingHint
                {
                    Framework = "NIST SP 800-207",
                    Theme = "Verify explicitly",
                },
            ]);

        result.Succeeded.Should().BeTrue();
        result.Mappings.Should().ContainSingle();
        result.Mappings[0].MappingSource.Should().Be(SecurityCrosswalkMappingSource.VendorPublished);
        result.Mappings[0].SourceEndpointId.Should().Be("zta-001");
        result.Mappings[0].TargetEndpointId.Should().Be("NIST SP 800-207:Verify explicitly");
    }

    private static SecurityCrosswalkMappingWriteRequest CreateWriteRequest(
        string sourceId,
        string targetId,
        SecurityCrosswalkMappingSource mappingSource,
        bool humanVerified) =>
        new()
        {
            SourceEndpointKind = SecurityCrosswalkEndpointKind.AuditControl,
            SourceEndpointId = sourceId,
            TargetEndpointKind = SecurityCrosswalkEndpointKind.McsbControl,
            TargetEndpointId = targetId,
            MappingType = SecurityCrosswalkMappingType.Related,
            MappingSource = mappingSource,
            Version = "1.0.0",
            Rationale = "test mapping",
            HumanVerified = humanVerified,
        };

    private static SecurityCrosswalkMappingRecord CreateRecord(
        Guid tenantId,
        string sourceId,
        string targetId,
        SecurityCrosswalkMappingSource mappingSource,
        string version,
        bool humanVerified)
    {
        DateTime utcNow = DateTime.UtcNow;

        return new SecurityCrosswalkMappingRecord
        {
            MappingId = Guid.NewGuid(),
            TenantId = tenantId,
            SourceEndpointKind = SecurityCrosswalkEndpointKind.AuditControl,
            SourceEndpointId = sourceId,
            TargetEndpointKind = SecurityCrosswalkEndpointKind.McsbControl,
            TargetEndpointId = targetId,
            MappingType = SecurityCrosswalkMappingType.Related,
            Confidence = 1.0m,
            MappingSource = mappingSource,
            Version = version,
            Rationale = "test",
            HumanVerified = humanVerified,
            CreatedUtc = utcNow,
            UpdatedUtc = utcNow,
        };
    }

    private sealed class InMemorySecurityCrosswalkRepository : ISecurityCrosswalkRepository
    {
        public List<SecurityCrosswalkMappingRecord> StoredMappings { get; } = [];

        public Task<IReadOnlyList<SecurityCrosswalkMappingRecord>> InsertManyAsync(
            IReadOnlyList<SecurityCrosswalkMappingRecord> mappings,
            CancellationToken cancellationToken = default)
        {
            StoredMappings.AddRange(mappings);
            return Task.FromResult(mappings);
        }

        public Task<IReadOnlyList<SecurityCrosswalkMappingRecord>> ListBySourceAsync(
            Guid tenantId,
            SecurityCrosswalkEndpointKind sourceEndpointKind,
            string sourceEndpointId,
            CancellationToken cancellationToken = default)
            => Task.FromResult<IReadOnlyList<SecurityCrosswalkMappingRecord>>(
                StoredMappings
                    .Where(mapping =>
                        mapping.TenantId == tenantId
                        && mapping.SourceEndpointKind == sourceEndpointKind
                        && string.Equals(mapping.SourceEndpointId, sourceEndpointId, StringComparison.Ordinal))
                    .ToList());
    }
}
