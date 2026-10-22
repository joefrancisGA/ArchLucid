namespace ArchLucid.Api.Diagnostics;

/// <summary>Interactive GET paths currently traced for 60s upstream hangs.</summary>
public enum InteractiveReadHangKind
{
    None = 0,
    LearningPlansList = 1,
    ArchitectureDraftGet = 2
}
