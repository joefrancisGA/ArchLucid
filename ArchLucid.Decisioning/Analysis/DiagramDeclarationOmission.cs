namespace ArchLucid.Decisioning.Analysis;

public sealed record DiagramDeclarationOmission(
    string DiagramParticipantNodeId,
    string DiagramParticipantLabel,
    string OmittedDeclarationNodeId,
    string OmittedDeclarationLabel,
    string PropertyName,
    string ReferencedToken,
    string ReferenceKind);
