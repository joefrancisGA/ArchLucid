namespace ArchLucid.Application.Tests.Drafts;

/// <summary>Reusable guided-intake intent strings that satisfy <see cref="ArchLucid.Contracts.Drafts.DraftIntakeValidation.MinimumFreeTextIntentLength" />.</summary>
internal static class DraftIntakeTestIntents
{
    public const string ValidCompliancePlatform =
        "We need a compliance automation platform for GRC analysts with auditable workflows, Entra ID integration, and HIPAA-aligned retention controls.";

    public const string ValidGrcWorkflow =
        "Build an AI-assisted GRC workflow for internal analysts with governed evidence trails, Entra ID authentication, and exportable audit packages.";

    public const string ValidWorkflowPlatform =
        "Build a workflow platform for analysts that supports governed evidence intake, Entra ID authentication, and exportable architecture review packages.";
}
