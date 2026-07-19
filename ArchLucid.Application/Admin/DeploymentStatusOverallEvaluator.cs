using ArchLucid.Contracts.Admin;

namespace ArchLucid.Application.Admin;

/// <summary>Maps health/readiness/agreement into Healthy / Warning / Failed / Unknown with text labels.</summary>
public static class DeploymentStatusOverallEvaluator
{
    public static (string Status, string Label) Evaluate(
        string healthStatus,
        string readinessStatus,
        string componentAgreement)
    {
        bool healthFailed = IsUnhealthy(healthStatus) || IsUnhealthy(readinessStatus);
        bool healthWarning = IsDegraded(healthStatus) || IsDegraded(readinessStatus);
        bool mismatch = string.Equals(
            componentAgreement,
            AdminDeploymentStatusValues.AgreementMismatch,
            StringComparison.OrdinalIgnoreCase);

        if (healthFailed || mismatch)
        {
            string reason = mismatch
                ? "Component BUILD_IDs disagree."
                : "Health or readiness is Unhealthy.";

            return (AdminDeploymentStatusValues.OverallFailed, $"Failed — {reason}");
        }

        bool agreementIncomplete = string.Equals(
                                         componentAgreement,
                                         AdminDeploymentStatusValues.AgreementPartial,
                                         StringComparison.OrdinalIgnoreCase)
                                     || string.Equals(
                                         componentAgreement,
                                         AdminDeploymentStatusValues.Unknown,
                                         StringComparison.OrdinalIgnoreCase);

        if (healthWarning || agreementIncomplete)
        {
            string reason = healthWarning
                ? "Health or readiness is Degraded."
                : "Component agreement is incomplete or Unknown.";

            return (AdminDeploymentStatusValues.OverallWarning, $"Warning — {reason}");
        }

        bool healthOk = IsHealthy(healthStatus) && IsHealthy(readinessStatus);
        bool agreementOk = string.Equals(
            componentAgreement,
            AdminDeploymentStatusValues.AgreementMatch,
            StringComparison.OrdinalIgnoreCase);

        if (healthOk && agreementOk)
        {
            return (
                AdminDeploymentStatusValues.OverallHealthy,
                "Healthy — components agree and readiness is Healthy.");
        }

        return (
            AdminDeploymentStatusValues.Unknown,
            "Unknown — insufficient health or agreement data.");
    }

    private static bool IsUnhealthy(string status) =>
        string.Equals(status, "Unhealthy", StringComparison.OrdinalIgnoreCase);

    private static bool IsDegraded(string status) =>
        string.Equals(status, "Degraded", StringComparison.OrdinalIgnoreCase);

    private static bool IsHealthy(string status) =>
        string.Equals(status, "Healthy", StringComparison.OrdinalIgnoreCase);
}
