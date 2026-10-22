using ArchLucid.Application.InfraEvidence;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Persistence.InfraEvidence;

using FluentAssertions;

namespace ArchLucid.Application.Tests.InfraEvidence;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class AzureInventoryDriftClassifierTests
{
    [Fact]
    public void ClassifyChange_expired_approval_does_not_grant_approved_status()
    {
        Guid changeId = Guid.NewGuid();
        AzureInventoryChangeRecord change = BuildChange(changeId, AzureInventoryChangeType.ResourceAdded);

        List<AzureInventoryDriftApprovalRecord> expiredApprovals =
        [
            new()
            {
                ApprovalId = Guid.NewGuid(),
                TenantId = Guid.NewGuid(),
                WorkspaceId = Guid.NewGuid(),
                ProjectId = Guid.NewGuid(),
                DiffId = Guid.NewGuid(),
                ChangeId = changeId,
                Approver = "owner",
                Reason = "planned",
                ExpirationUtc = DateTime.UtcNow.AddHours(-1),
                Status = AzureInventoryDriftApprovalStatus.Expired,
                CreatedUtc = DateTime.UtcNow.AddDays(-2),
            },
        ];

        AzureInventoryDriftClassification expiredClassification =
            AzureInventoryDriftClassifier.ClassifyChange(change, expiredApprovals, DateTime.UtcNow);

        expiredClassification.Should().NotBe(AzureInventoryDriftClassification.Approved);

        List<AzureInventoryDriftApprovalRecord> activeApprovals =
        [
            new()
            {
                ApprovalId = Guid.NewGuid(),
                TenantId = expiredApprovals[0].TenantId,
                WorkspaceId = expiredApprovals[0].WorkspaceId,
                ProjectId = expiredApprovals[0].ProjectId,
                DiffId = expiredApprovals[0].DiffId,
                ChangeId = changeId,
                Approver = "owner",
                Reason = "planned",
                ExpirationUtc = DateTime.UtcNow.AddDays(30),
                Status = AzureInventoryDriftApprovalStatus.Active,
                CreatedUtc = DateTime.UtcNow,
            },
        ];

        AzureInventoryDriftClassification activeClassification =
            AzureInventoryDriftClassifier.ClassifyChange(change, activeApprovals, DateTime.UtcNow);

        activeClassification.Should().Be(AzureInventoryDriftClassification.Approved);
    }

    [Fact]
    public void ClassifyChange_public_ip_remains_security_relevant_when_architecture_approved()
    {
        Guid changeId = Guid.NewGuid();
        AzureInventoryChangeRecord change = BuildChange(
            changeId,
            AzureInventoryChangeType.NetworkExposureChanged,
            property: "enablePublicNetworkAccess",
            newValue: "true");

        List<AzureInventoryDriftApprovalRecord> approvals =
        [
            new()
            {
                ApprovalId = Guid.NewGuid(),
                TenantId = Guid.NewGuid(),
                WorkspaceId = Guid.NewGuid(),
                ProjectId = Guid.NewGuid(),
                DiffId = Guid.NewGuid(),
                ChangeId = changeId,
                Approver = "architect",
                Reason = "approved architecture change",
                ExpirationUtc = DateTime.UtcNow.AddDays(30),
                Status = AzureInventoryDriftApprovalStatus.Active,
                CreatedUtc = DateTime.UtcNow,
            },
        ];

        AzureInventoryDriftClassification classification =
            AzureInventoryDriftClassifier.ClassifyChange(change, approvals, DateTime.UtcNow);

        classification.Should().Be(AzureInventoryDriftClassification.PotentiallyDangerous);
    }

    private static AzureInventoryChangeRecord BuildChange(
        Guid changeId,
        AzureInventoryChangeType changeType,
        string? property = null,
        string? newValue = null) =>
        new()
        {
            ChangeId = changeId,
            DiffId = Guid.NewGuid(),
            SnapshotAId = Guid.NewGuid(),
            SnapshotBId = Guid.NewGuid(),
            ChangeType = changeType,
            Property = property,
            NewValue = newValue,
            ProvenanceKind = ProvenanceKind.ObservedFact,
        };
}
