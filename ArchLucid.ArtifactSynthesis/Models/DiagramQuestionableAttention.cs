namespace ArchLucid.ArtifactSynthesis.Models;

/// <summary>Policy-pack supplied explanation for a resource that needs human review.</summary>
public sealed record DiagramQuestionableAttention(
    string Reason,
    string RecommendedAction);
