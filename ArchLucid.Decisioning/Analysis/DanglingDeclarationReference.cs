namespace ArchLucid.Decisioning.Analysis;

public sealed record DanglingDeclarationReference(
    string SourceNodeId,
    string SourceNodeLabel,
    string PropertyName,
    string ReferencedToken,
    string ReferenceKind);
