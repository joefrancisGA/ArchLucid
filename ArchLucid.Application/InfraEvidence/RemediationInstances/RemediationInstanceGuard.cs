using System.Text.Json;

using ArchLucid.Core.InfraEvidence;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence.RemediationInstances;

public static class RemediationInstanceGuard
{
    public static bool CanTransition(
        RemediationInstanceStatus current,
        RemediationInstanceStatus next,
        out string? errorMessage)
    {
        bool allowed = (current, next) switch
        {
            (RemediationInstanceStatus.Classified, RemediationInstanceStatus.PreflightPassed) => true,
            (RemediationInstanceStatus.Classified, RemediationInstanceStatus.PreflightBlocked) => true,
            (RemediationInstanceStatus.PreflightPassed, RemediationInstanceStatus.Approved) => true,
            (RemediationInstanceStatus.Approved, RemediationInstanceStatus.WaveAssigned) => true,
            (RemediationInstanceStatus.WaveAssigned, RemediationInstanceStatus.Executed) => true,
            (RemediationInstanceStatus.Executed, RemediationInstanceStatus.Verified) => true,
            (RemediationInstanceStatus.Executed, RemediationInstanceStatus.VerificationFailed) => true,
            (RemediationInstanceStatus.Verified, RemediationInstanceStatus.Closed) => true,
            _ => false,
        };

        if (!allowed)
        {
            errorMessage = $"Cannot transition remediation instance from {current} to {next}.";
            return false;
        }

        errorMessage = null;
        return true;
    }

    public static bool IsStrongMatch(RemediationPatternMatchKind matchKind) =>
        matchKind is RemediationPatternMatchKind.ExactMatch or RemediationPatternMatchKind.ProbableMatch;

    public static bool TryParsePatternContent(
        RemediationPatternVersionRecord version,
        out RemediationPatternVersionContent? content,
        out string? errorMessage)
    {
        ArgumentNullException.ThrowIfNull(version);

        try
        {
            content = JsonSerializer.Deserialize<RemediationPatternVersionContent>(version.ContentJson);
            errorMessage = null;
            return content is not null;
        }
        catch (JsonException ex)
        {
            content = null;
            errorMessage = $"Pattern content JSON is invalid: {ex.Message}";
            return false;
        }
    }

    public static bool HasRollbackDefinition(RemediationPatternVersionContent content) =>
        !string.IsNullOrWhiteSpace(content.Rollback?.RunbookRef)
        || !string.IsNullOrWhiteSpace(content.Rollback?.AdvisoryTerraformTemplateRef);
}
