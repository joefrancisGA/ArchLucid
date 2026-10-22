using ArchLucid.Core.InfraEvidence;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence.AuditEvidence;

/// <summary>
/// Picks the newest remediation instance that tried a control and is not already on the verified-association list.
/// </summary>
public static class AuditEvidenceLatestRemediationAttemptSelector
{
    public static AuditEvidenceLineageLatestRemediationAttempt? Select(
        Guid assessmentId,
        Guid controlId,
        IReadOnlyList<RemediationInstanceRecord> instances,
        IReadOnlyCollection<Guid> associatedInstanceIds)
    {
        ArgumentNullException.ThrowIfNull(instances);
        ArgumentNullException.ThrowIfNull(associatedInstanceIds);

        HashSet<Guid> excludedInstanceIds = associatedInstanceIds.Count == 0
            ? []
            : associatedInstanceIds.ToHashSet();

        RemediationInstanceRecord? selected = instances
            .Where(instance => IsEligible(assessmentId, controlId, instance, excludedInstanceIds))
            .OrderByDescending(instance => instance.UpdatedUtc)
            .ThenBy(instance => instance.InstanceId)
            .FirstOrDefault();

        if (selected is null)
        {
            return null;
        }

        return new AuditEvidenceLineageLatestRemediationAttempt
        {
            InstanceId = selected.InstanceId,
            Status = selected.Status,
            ControlId = controlId,
            UpdatedUtc = selected.UpdatedUtc,
        };
    }

    private static bool IsEligible(
        Guid assessmentId,
        Guid controlId,
        RemediationInstanceRecord instance,
        HashSet<Guid> excludedInstanceIds)
    {
        if (instance.ControlId != controlId)
        {
            return false;
        }

        if (instance.AssessmentId is Guid instanceAssessmentId && instanceAssessmentId != assessmentId)
        {
            return false;
        }

        if (!IsAttemptStatus(instance.Status))
        {
            return false;
        }

        if (excludedInstanceIds.Contains(instance.InstanceId))
        {
            return false;
        }

        return true;
    }

    private static bool IsAttemptStatus(RemediationInstanceStatus status)
    {
        return status is RemediationInstanceStatus.ChangeImplemented
            or RemediationInstanceStatus.VerificationFailed
            or RemediationInstanceStatus.Verified;
    }
}
