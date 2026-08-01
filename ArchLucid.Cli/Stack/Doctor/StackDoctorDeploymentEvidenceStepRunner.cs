using ArchLucid.Cli.Commands;

namespace ArchLucid.Cli.Stack.Doctor;

internal static class StackDoctorDeploymentEvidenceStepRunner
{
    internal static async Task<StackDoctorStepResult> RunAsync(
        string apiBaseUrl,
        string deploymentEnvironment,
        CancellationToken cancellationToken = default)
    {
        string? urlError = ArchLucidApiClient.GetInvalidApiBaseUrlReason(apiBaseUrl);

        if (urlError is not null)
        {
            return Fail($"Invalid API base URL: {urlError}");
        }

        string baseUrl = apiBaseUrl.Trim().TrimEnd('/');
        ArchLucidProjectScaffolder.ArchLucidCliConfig? cli = CliCommandShared.TryLoadConfigFromCwd();

        using HttpClient http = ArchLucidApiClient.CreateSharedApiHttpClient(baseUrl, cli);
        http.Timeout = TimeSpan.FromSeconds(120);

        DeploymentEvidenceProbeBundle bundle = await DeploymentEvidenceProbeRunner.RunOnceAsync(
                http,
                baseUrl,
                syntheticPath: "/version",
                allowMissingOpenApi: false,
                syntheticProbeApiKey: null,
                syntheticProbeBearerToken: null,
                cancellationToken)
            .ConfigureAwait(false);

        if (bundle.AllRequiredPassed)
        {
            return new StackDoctorStepResult
            {
                StepId = "deployment-evidence",
                DisplayName = "Post-deploy deployment evidence",
                Verdict = StackDoctorVerdict.Pass,
                Detail = $"All required probes passed for {deploymentEnvironment} @ {baseUrl}.",
            };
        }

        int failedCount = bundle.Probes.Count(static probe => !probe.Passed);

        return Fail($"{failedCount} required probe(s) failed for {deploymentEnvironment} @ {baseUrl}.");
    }

    private static StackDoctorStepResult Fail(string detail) =>
        new()
        {
            StepId = "deployment-evidence",
            DisplayName = "Post-deploy deployment evidence",
            Verdict = StackDoctorVerdict.Fail,
            Detail = detail,
        };
}
