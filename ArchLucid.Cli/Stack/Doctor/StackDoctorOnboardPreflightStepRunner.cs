using ArchLucid.Cli.Commands;

using Microsoft.Extensions.Configuration;

namespace ArchLucid.Cli.Stack.Doctor;

internal static class StackDoctorOnboardPreflightStepRunner
{
    internal static async Task<StackDoctorStepResult> RunAsync(
        string apiBaseUrl,
        CancellationToken cancellationToken = default)
    {
        string? urlError = ArchLucidApiClient.GetInvalidApiBaseUrlReason(apiBaseUrl);

        if (urlError is not null)
        {
            return Fail($"Invalid API base URL: {urlError}");
        }

        string baseUrl = apiBaseUrl.Trim().TrimEnd('/');
        IConfiguration localConfiguration = PilotPreflightLocalSteps.LoadLocalConfiguration(simulateProduction: true);
        List<PilotPreflightStepResult> steps =
        [
            .. PilotPreflightProductionLikeConfigLintSteps.Evaluate(localConfiguration, simulateProduction: true),
            .. PilotPreflightLocalSteps.Evaluate(localConfiguration, simulateProduction: true),
        ];

        using HttpClient http = CliAuthorizedHttpClient.Create(baseUrl);
        PilotPreflightRunner runner = new(http);
        PilotPreflightReport report = await runner.RunAsync(baseUrl, steps, cancellationToken).ConfigureAwait(false);

        if (report.AllBlockingPassed && report.WarnCount == 0)
        {
            return new StackDoctorStepResult
            {
                StepId = "onboard-preflight",
                DisplayName = "Onboard preflight (HTTP)",
                Verdict = StackDoctorVerdict.Pass,
                Detail = $"PASS — 0 blocking, 0 warning for {baseUrl}.",
            };
        }

        if (report.AllBlockingPassed)
        {
            return new StackDoctorStepResult
            {
                StepId = "onboard-preflight",
                DisplayName = "Onboard preflight (HTTP)",
                Verdict = StackDoctorVerdict.Warn,
                Detail = $"PASS with {report.WarnCount} warning(s) for {baseUrl}.",
            };
        }

        return new StackDoctorStepResult
        {
            StepId = "onboard-preflight",
            DisplayName = "Onboard preflight (HTTP)",
            Verdict = StackDoctorVerdict.Fail,
            Detail = $"BLOCK — {report.BlockCount} blocking failure(s), {report.WarnCount} warning(s) for {baseUrl}.",
        };
    }

    private static StackDoctorStepResult Fail(string detail) =>
        new()
        {
            StepId = "onboard-preflight",
            DisplayName = "Onboard preflight (HTTP)",
            Verdict = StackDoctorVerdict.Fail,
            Detail = detail,
        };
}
