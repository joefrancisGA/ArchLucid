using ArchLucid.Core.Comparison;
using ArchLucid.Core.Conversation;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Models;

namespace ArchLucid.Host.Core.Services.Ask;

/// <summary>Immutable inputs assembled before an Ask LLM call.</summary>
public sealed record AskPreparedContext(
    ConversationThread Thread,
    string Question,
    string HistoryText,
    ManifestDocument? Manifest,
    Guid? EffectiveRunId,
    Guid? BaseRunId,
    Guid? TargetRunId,
    ComparisonResult? ComparisonResult,
    string ContextJson,
    string RetrievalContext,
    bool RetrievalDegraded,
    ScopeContext Scope);
