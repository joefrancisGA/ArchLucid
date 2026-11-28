using ArchLucid.Core.InfraEvidence;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Persistence.Tests.InfraEvidence;

[Trait("Category", "Unit")]
[Trait("Suite", "Persistence")]
public sealed class SqlSecurityEvidenceEnumBoundaryTests
{
    [Theory]
    [InlineData(null)]
    [InlineData(-1)]
    [InlineData(int.MaxValue)]
    public void Drift_approval_status_requires_a_stored_declared_ordinal(int? status)
    {
        Assert.Throws<InvalidDataException>(() =>
            SqlAzureInventoryDriftApprovalRepository.Map(new() { Status = status }));
    }

    [Theory]
    [InlineData(null)]
    [InlineData(-1)]
    [InlineData(int.MaxValue)]
    public void Operational_exception_status_requires_a_stored_declared_ordinal(int? status)
    {
        Assert.Throws<InvalidDataException>(() =>
            SqlOperationalSecurityExceptionRepository.Map(new() { Status = status }));
    }

    [Theory]
    [InlineData(null, 0)]
    [InlineData(0, null)]
    [InlineData(0, -1)]
    [InlineData(int.MaxValue, 0)]
    [InlineData(0, int.MaxValue)]
    public void Declared_connections_require_both_stored_declared_ordinals(int? status, int? relationship)
    {
        Assert.Throws<InvalidDataException>(() =>
            SqlSecurityDeclaredConnectionRepository.Map(new() { Status = status, RelationshipType = relationship }));
    }

    [Theory]
    [InlineData(null)]
    [InlineData(-1)]
    [InlineData(4)]
    public void Designated_baseline_requires_a_stored_kind(int? kind) => Assert.Throws<InvalidDataException>(() =>
        SqlAzureInventoryBaselineRepository.Map(new() { BaselineKind = kind }));

    [Theory]
    [InlineData(null, 0, 0, 0, 0)]
    [InlineData(0, null, 0, 0, 0)]
    [InlineData(0, 0, null, 0, 0)]
    [InlineData(0, 0, 0, null, 0)]
    [InlineData(0, 0, 0, 0, null)]
    [InlineData(0, 0, 4, 0, 0)]
    [InlineData(0, 0, 98, 0, 0)]
    [InlineData(3, 0, 0, 0, 0)]
    public void Asset_assertion_requires_each_explicit_declared_field(int? status, int? sensitivity, int? regulation,
        int? environment, int? criticality)
    {
        Assert.Throws<InvalidDataException>(() => SqlSecurityAssetAssertionRepository.Map(new()
        {
            Status = status, DataSensitivity = sensitivity, RegulatoryClass = regulation,
            DeploymentEnvironment = environment, BusinessCriticality = criticality,
        }));
    }

    [Fact]
    public void Preserves_explicit_historical_zero_values_and_nonzero_values()
    {
        Assert.Equal(AzureInventoryDriftApprovalStatus.Active,
            SqlAzureInventoryDriftApprovalRepository.Map(new() { Status = 0 }).Status);
        Assert.Equal(AzureInventoryDriftApprovalStatus.Expired,
            SqlAzureInventoryDriftApprovalRepository.Map(new() { Status = 1 }).Status);
        Assert.Equal(OperationalSecurityExceptionStatus.Active,
            SqlOperationalSecurityExceptionRepository.Map(new() { Status = 0 }).Status);
        Assert.Equal(OperationalSecurityExceptionStatus.Revoked,
            SqlOperationalSecurityExceptionRepository.Map(new() { Status = 2 }).Status);

        var active = SqlSecurityDeclaredConnectionRepository.Map(new() { Status = 0, RelationshipType = 0 });
        Assert.Equal(SecurityDeclaredConnectionStatus.Active, active.Status);
        Assert.Equal(SecurityDeclaredConnectionRelationshipType.ConnectsTo, active.RelationshipType);
        var expired = SqlSecurityDeclaredConnectionRepository.Map(new() { Status = 1, RelationshipType = 1 });
        Assert.Equal(SecurityDeclaredConnectionStatus.Expired, expired.Status);
        Assert.Equal(SecurityDeclaredConnectionRelationshipType.DependsOn, expired.RelationshipType);
        Assert.Equal(AzureInventoryBaselineKind.Approved, SqlAzureInventoryBaselineRepository.Map(new() { BaselineKind = 0 }).BaselineKind);
        Assert.Equal(AzureInventoryBaselineKind.Release, SqlAzureInventoryBaselineRepository.Map(new() { BaselineKind = 3 }).BaselineKind);
        var assertion = SqlSecurityAssetAssertionRepository.Map(new()
        {
            Status = 0, DataSensitivity = 0, RegulatoryClass = 99, DeploymentEnvironment = 0, BusinessCriticality = 0,
        });
        Assert.Equal(SecurityAssetAssertionStatus.Active, assertion.Status);
        Assert.Equal(SecurityAssetRegulatoryClass.Other, assertion.RegulatoryClass);
        Assert.Equal(SecurityAssetDeploymentEnvironment.Unknown, assertion.DeploymentEnvironment);
    }
}
