namespace ArchLucid.Decisioning.CareerArtifacts;

public sealed record CareerArtifactCompletenessResult(
    bool CanRender,
    IReadOnlyList<CareerArtifactBlockReason> BlockReasons,
    IReadOnlyList<string> HeaderLines,
    IReadOnlyList<string> Warnings);
