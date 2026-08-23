using ArchLucid.Contracts.Common;

namespace ArchLucid.Contracts.Governance.Coverage;

/// <summary>Intake facts used to resolve explainable assurance coverage before run creation or execute.</summary>
public sealed class CoveragePreviewInput
{
    public CloudProvider CloudProvider
    {
        get;
        set;
    } = CloudProvider.None;

    /// <summary>When true, evaluation scope is narrowed to focused first-review breadth (baseline + org-required + overlays).</summary>
    public bool FocusedPilotModeEnabled
    {
        get;
        set;
    } = true;

    /// <summary>Raw L0 security intake answer (PII / PHI / PCI themes).</summary>
    public string? SecurityIntakeAnswer
    {
        get;
        set;
    }

    /// <summary>Free-text description and requirements used for deterministic keyword triggers only.</summary>
    public string? DescriptionText
    {
        get;
        set;
    }
}
