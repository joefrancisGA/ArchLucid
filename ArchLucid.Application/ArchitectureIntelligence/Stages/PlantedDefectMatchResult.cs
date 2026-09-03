namespace ArchLucid.Application.ArchitectureIntelligence.Stages;

internal sealed record PlantedDefectMatchResult(
    List<string> DetectedDefectIds,
    List<string> MissedDefectIds,
    double Recall);
