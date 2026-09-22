namespace ArchLucid.Core.Integration;

/// <summary>CG-093 — execute posture fields stamped on outbound integration-event payloads.</summary>
public sealed record IntegrationEventCareerPostureFields(
    string StructuralExecutionMode,
    string WorkingCareerRehearsalDoor,
    bool CareerComplete);
