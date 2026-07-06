namespace ArchLucid.Cli.Stack.Doctor;

internal enum StackDoctorStepKind
{
    PrerequisitesScript,
    TerraformDriftScript,
    ConfigLint,
    DeploymentEvidence,
    OnboardPreflight,
}
