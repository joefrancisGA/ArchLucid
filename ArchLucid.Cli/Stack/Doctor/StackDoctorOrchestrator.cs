namespace ArchLucid.Cli.Stack.Doctor;

internal sealed class StackDoctorOrchestrator
{
    internal async Task<StackDoctorReport> RunAsync(
        string repositoryRoot,
        string profile,
        StackDoctorOptions options,
        CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(repositoryRoot);
        ArgumentException.ThrowIfNullOrWhiteSpace(profile);
        ArgumentNullException.ThrowIfNull(options);

        IReadOnlyList<StackDoctorStepDefinition> plan = StackDoctorStepPlan.Resolve(profile);
        List<StackDoctorStepResult> results = new(capacity: plan.Count);

        foreach (StackDoctorStepDefinition step in plan)
        {
            StackDoctorStepResult result = await RunStepAsync(
                    repositoryRoot,
                    step,
                    options,
                    cancellationToken)
                .ConfigureAwait(false);

            results.Add(result);
        }

        StackDoctorVerdict overall = StackDoctorVerdictRollup.FromSteps(results);

        return new StackDoctorReport
        {
            Profile = profile,
            RepositoryRoot = repositoryRoot,
            GeneratedUtc = DateTime.UtcNow,
            OverallVerdict = overall,
            Steps = results,
        };
    }

    private static async Task<StackDoctorStepResult> RunStepAsync(
        string repositoryRoot,
        StackDoctorStepDefinition step,
        StackDoctorOptions options,
        CancellationToken cancellationToken)
    {
        return step.Kind switch
        {
            StackDoctorStepKind.PrerequisitesScript => await RunPrerequisitesAsync(
                repositoryRoot,
                step,
                cancellationToken).ConfigureAwait(false),
            StackDoctorStepKind.TerraformDriftScript => await RunTerraformDriftAsync(
                repositoryRoot,
                step,
                cancellationToken).ConfigureAwait(false),
            StackDoctorStepKind.ConfigLint => RunConfigLint(step),
            StackDoctorStepKind.DeploymentEvidence => await RunDeploymentEvidenceAsync(
                step,
                options,
                cancellationToken).ConfigureAwait(false),
            StackDoctorStepKind.OnboardPreflight => await RunOnboardPreflightAsync(
                step,
                options,
                cancellationToken).ConfigureAwait(false),
            _ => Skipped(step, "Unsupported step kind."),
        };
    }

    private static async Task<StackDoctorStepResult> RunPrerequisitesAsync(
        string repositoryRoot,
        StackDoctorStepDefinition step,
        CancellationToken cancellationToken)
    {
        string profile = step.PrerequisitesProfile ?? StackDoctorProfile.FirstPilotMinimum;
        string jsonOut = Path.Combine("artifacts", "pilot", $"prerequisites-{profile}.json");
        string markdownOut = Path.Combine("artifacts", "pilot", $"prerequisites-{profile}.md");

        (int exitCode, string output) = await StackDoctorPwshScriptRunner.RunAsync(
                repositoryRoot,
                Path.Combine("scripts", "Test-ArchLucidPrerequisites.ps1"),
                ["-Profile", profile, "-JsonOut", jsonOut, "-MarkdownOut", markdownOut],
                cancellationToken)
            .ConfigureAwait(false);

        return new StackDoctorStepResult
        {
            StepId = step.StepId,
            DisplayName = step.DisplayName,
            Verdict = MapScriptExitCode(exitCode),
            Detail = string.IsNullOrWhiteSpace(output)
                ? $"Exit code {exitCode}."
                : Truncate(output, 500),
            ArtifactPath = Path.Combine(repositoryRoot, jsonOut),
        };
    }

    private static async Task<StackDoctorStepResult> RunTerraformDriftAsync(
        string repositoryRoot,
        StackDoctorStepDefinition step,
        CancellationToken cancellationToken)
    {
        string jsonOut = Path.Combine("artifacts", "deployment", "terraform-drift-preflight.json");
        string markdownOut = Path.Combine("artifacts", "deployment", "terraform-drift-preflight.md");

        (int exitCode, string output) = await StackDoctorPwshScriptRunner.RunAsync(
                repositoryRoot,
                Path.Combine("scripts", "Assert-TerraformDeploymentDriftPreflight.ps1"),
                ["-JsonOut", jsonOut, "-MarkdownOut", markdownOut],
                cancellationToken)
            .ConfigureAwait(false);

        return new StackDoctorStepResult
        {
            StepId = step.StepId,
            DisplayName = step.DisplayName,
            Verdict = MapScriptExitCode(exitCode),
            Detail = string.IsNullOrWhiteSpace(output)
                ? $"Exit code {exitCode}."
                : Truncate(output, 500),
            ArtifactPath = Path.Combine(repositoryRoot, jsonOut),
        };
    }

    private static StackDoctorStepResult RunConfigLint(StackDoctorStepDefinition step)
    {
        StackDoctorStepResult result = StackDoctorConfigLintStepRunner.Run(step.ProductionLikeConfigLint);

        return new StackDoctorStepResult
        {
            StepId = step.StepId,
            DisplayName = step.DisplayName,
            Verdict = result.Verdict,
            Detail = result.Detail,
        };
    }

    private static async Task<StackDoctorStepResult> RunDeploymentEvidenceAsync(
        StackDoctorStepDefinition step,
        StackDoctorOptions options,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(options.ApiBaseUrl))
        {
            return new StackDoctorStepResult
            {
                StepId = step.StepId,
                DisplayName = step.DisplayName,
                Verdict = StackDoctorVerdict.Fail,
                Detail = "Missing --api-base-url (required for post-deploy profile).",
            };
        }

        StackDoctorStepResult result = await StackDoctorDeploymentEvidenceStepRunner.RunAsync(
                options.ApiBaseUrl,
                options.DeploymentEnvironment,
                cancellationToken)
            .ConfigureAwait(false);

        return new StackDoctorStepResult
        {
            StepId = step.StepId,
            DisplayName = step.DisplayName,
            Verdict = result.Verdict,
            Detail = result.Detail,
        };
    }

    private static async Task<StackDoctorStepResult> RunOnboardPreflightAsync(
        StackDoctorStepDefinition step,
        StackDoctorOptions options,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(options.ApiBaseUrl))
        {
            return new StackDoctorStepResult
            {
                StepId = step.StepId,
                DisplayName = step.DisplayName,
                Verdict = StackDoctorVerdict.Fail,
                Detail = "Missing --api-base-url (required for post-deploy profile).",
            };
        }

        StackDoctorStepResult result = await StackDoctorOnboardPreflightStepRunner.RunAsync(
                options.ApiBaseUrl,
                cancellationToken)
            .ConfigureAwait(false);

        return new StackDoctorStepResult
        {
            StepId = step.StepId,
            DisplayName = step.DisplayName,
            Verdict = result.Verdict,
            Detail = result.Detail,
        };
    }

    private static StackDoctorStepResult Skipped(StackDoctorStepDefinition step, string detail) =>
        new()
        {
            StepId = step.StepId,
            DisplayName = step.DisplayName,
            Verdict = StackDoctorVerdict.Skipped,
            Detail = detail,
        };

    private static StackDoctorVerdict MapScriptExitCode(int exitCode) =>
        exitCode switch
        {
            0 => StackDoctorVerdict.Pass,
            1 => StackDoctorVerdict.Warn,
            _ => StackDoctorVerdict.Fail,
        };

    private static string Truncate(string value, int maxChars)
    {
        if (value.Length <= maxChars)
            return value;

        return value[..maxChars] + "…";
    }
}
