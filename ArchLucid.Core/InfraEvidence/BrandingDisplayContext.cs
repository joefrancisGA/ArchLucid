namespace ArchLucid.Core.InfraEvidence;

/// <summary>Where tenant branding is rendered; logo asset selection may vary by surface (BR-04 expands rules).</summary>
public enum BrandingDisplayContext
{
    ApplicationHeader = 0,
    Navigation = 1,
    Login = 2,
    Dashboard = 3,
    ArchitectureDiagram = 4,
    SecurityDiagram = 5,
    MermaidDiagram = 6,
    ReportCover = 7,
    ReportHeader = 8,
    ReportFooter = 9,
    Export = 10,
    Email = 11,
    Presentation = 12,
    Print = 13,
    Mobile = 14,
    Favicon = 15,
}
