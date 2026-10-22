using ArchLucid.Contracts.Admin;

namespace ArchLucid.Application.Admin;

/// <summary>Pure frontend / API / worker BUILD_ID agreement rules for deployment-status.</summary>
public static class DeploymentComponentAgreementEvaluator
{
    public static (string Agreement, string Detail) Evaluate(
        string? apiBuildId,
        string? frontendBuildId,
        string? workerBuildId)
    {
        string? api = Normalize(apiBuildId);
        string? frontend = Normalize(frontendBuildId);
        string? worker = Normalize(workerBuildId);

        List<string> known = [];

        if (api is not null)
            known.Add(api);

        if (frontend is not null)
            known.Add(frontend);

        if (worker is not null)
            known.Add(worker);

        if (known.Count == 0)
        {
            return (
                AdminDeploymentStatusValues.Unknown,
                "No component BUILD_IDs are available.");
        }

        if (known.Count == 1)
        {
            return (
                AdminDeploymentStatusValues.Unknown,
                "Only one component BUILD_ID is known; cannot confirm agreement.");
        }

        bool allEqual = known.Distinct(StringComparer.OrdinalIgnoreCase).Count() == 1;

        if (!allEqual)
        {
            return (
                AdminDeploymentStatusValues.AgreementMismatch,
                $"Component BUILD_IDs disagree (API={Display(api)}, frontend={Display(frontend)}, worker={Display(worker)}).");
        }

        bool anyUnknown = api is null || frontend is null || worker is null;

        if (anyUnknown)
        {
            return (
                AdminDeploymentStatusValues.AgreementPartial,
                $"Known components agree on {known[0]}, but at least one component BUILD_ID is Unknown.");
        }

        return (
            AdminDeploymentStatusValues.AgreementMatch,
            "Frontend, API, and worker BUILD_IDs match.");
    }

    private static string? Normalize(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return null;

        string trimmed = value.Trim();

        if (string.Equals(trimmed, AdminDeploymentStatusValues.Unknown, StringComparison.OrdinalIgnoreCase))
            return null;

        if (string.Equals(trimmed, "unknown", StringComparison.OrdinalIgnoreCase))
            return null;

        return trimmed;
    }

    private static string Display(string? value) =>
        value ?? AdminDeploymentStatusValues.Unknown;
}
