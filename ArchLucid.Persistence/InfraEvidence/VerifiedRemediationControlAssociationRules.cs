using ArchLucid.Core.Scoping;

namespace ArchLucid.Persistence.InfraEvidence;

/// <summary>
///     Shared write rules for the association row. A repeat of the same instance, snapshot, and control
///     keeps the original association id and only moves <see cref="VerifiedRemediationControlAssociationRecord.UpdatedUtc" />.
/// </summary>
internal static class VerifiedRemediationControlAssociationRules
{
    public static void EnsureWritable(ProjectScopeKey scope, VerifiedRemediationControlAssociationRecord record)
    {
        if (!scope.Matches(record.TenantId, record.WorkspaceId, record.ProjectId))
        {
            throw new InvalidOperationException("Scoped association payload does not match project authority.");
        }

        if (record.AssociationId == Guid.Empty)
        {
            throw new ArgumentException("Association id is required.", nameof(record));
        }

        if (record.InstanceId == Guid.Empty)
        {
            throw new ArgumentException("Instance id is required.", nameof(record));
        }

        if (record.VerificationSnapshotId == Guid.Empty)
        {
            throw new ArgumentException("Verification snapshot id is required.", nameof(record));
        }

        if (record.ControlId == Guid.Empty)
        {
            throw new ArgumentException("Control id is required.", nameof(record));
        }
    }

    public static string BuildKey(VerifiedRemediationControlAssociationRecord record) =>
        string.Join(
            ":",
            record.TenantId.ToString("D"),
            record.InstanceId.ToString("D"),
            record.VerificationSnapshotId.ToString("D"),
            record.ControlId.ToString("D"));

    public static VerifiedRemediationControlAssociationRecord Touch(
        VerifiedRemediationControlAssociationRecord existing,
        DateTime updatedUtc) =>
        new()
        {
            AssociationId = existing.AssociationId,
            TenantId = existing.TenantId,
            WorkspaceId = existing.WorkspaceId,
            ProjectId = existing.ProjectId,
            InstanceId = existing.InstanceId,
            VerificationSnapshotId = existing.VerificationSnapshotId,
            ControlId = existing.ControlId,
            AssessmentId = existing.AssessmentId,
            CreatedUtc = existing.CreatedUtc,
            UpdatedUtc = updatedUtc,
        };
}
