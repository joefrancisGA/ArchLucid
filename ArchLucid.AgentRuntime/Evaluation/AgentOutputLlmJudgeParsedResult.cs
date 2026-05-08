namespace ArchLucid.AgentRuntime.Evaluation;

/// <summary>Structured output from the LLM rubric judge (<c>overallQuality</c> 0..1).</summary>
public sealed record AgentOutputLlmJudgeParsedResult(double OverallQuality, string? Rationale);
