using System.Text.Json.Serialization;

namespace ArchLucid.Contracts.Drafts;

/// <summary>Provenance layer for a selected intake question (ADR 0051 L0/L1).</summary>
[JsonConverter(typeof(JsonStringEnumConverter))]
public enum ElicitationQuestionSource
{
    /// <summary>Universal Well-Architected pillar and actor questions — no LLM.</summary>
    L0Universal,

    /// <summary>Explicit <c>elicitationQuestions</c> from an effective policy pack.</summary>
    L1PackExplicit,

    /// <summary>Cold-start prompt derived from an effective <c>complianceRuleKey</c>.</summary>
    L1PackDerived,
}
