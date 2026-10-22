namespace ArchLucid.Cli.Stack.Doctor;

/// <summary>Maps stack doctor profiles to ordered readiness steps (TB-658).</summary>
internal static class StackDoctorStepPlan
{
    internal static IReadOnlyList<StackDoctorStepDefinition> Resolve(string profile)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(profile);

        return profile switch
        {
            StackDoctorProfile.FirstPilotMinimum =>
            [
                PrerequisitesStep("FirstPilotMinimum"),
                ConfigLintStep(productionLike: false),
            ],
            StackDoctorProfile.StagingRealLlm =>
            [
                PrerequisitesStep("StagingRealLlm"),
                ConfigLintStep(productionLike: false),
            ],
            StackDoctorProfile.ProductionLike =>
            [
                PrerequisitesStep("ProductionLike"),
                ConfigLintStep(productionLike: true),
            ],
            StackDoctorProfile.StagingDeploy =>
            [
                PrerequisitesStep("ProductionLike"),
                TerraformDriftStep(),
                ConfigLintStep(productionLike: true),
            ],
            StackDoctorProfile.PostDeploy =>
            [
                DeploymentEvidenceStep(),
                OnboardPreflightStep(),
            ],
            _ => throw new ArgumentOutOfRangeException(nameof(profile), profile, "Unknown stack doctor profile."),
        };
    }

    private static StackDoctorStepDefinition PrerequisitesStep(string prerequisitesProfile) =>
        new()
        {
            StepId = "pilot-prerequisites",
            DisplayName = $"Pilot prerequisites ({prerequisitesProfile})",
            Kind = StackDoctorStepKind.PrerequisitesScript,
            PrerequisitesProfile = prerequisitesProfile,
        };

    private static StackDoctorStepDefinition ConfigLintStep(bool productionLike) =>
        new()
        {
            StepId = "config-lint",
            DisplayName = productionLike
                ? "Production-like config lint"
                : "Config lint (simulate production)",
            Kind = StackDoctorStepKind.ConfigLint,
            ProductionLikeConfigLint = productionLike,
        };

    private static StackDoctorStepDefinition TerraformDriftStep() =>
        new()
        {
            StepId = "terraform-drift-preflight",
            DisplayName = "Terraform/CD drift preflight",
            Kind = StackDoctorStepKind.TerraformDriftScript,
        };

    private static StackDoctorStepDefinition DeploymentEvidenceStep() =>
        new()
        {
            StepId = "deployment-evidence",
            DisplayName = "Post-deploy deployment evidence",
            Kind = StackDoctorStepKind.DeploymentEvidence,
        };

    private static StackDoctorStepDefinition OnboardPreflightStep() =>
        new()
        {
            StepId = "onboard-preflight",
            DisplayName = "Onboard preflight (HTTP)",
            Kind = StackDoctorStepKind.OnboardPreflight,
        };
}
