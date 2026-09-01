namespace ArchLucid.AgentRuntime;

/// <summary>Records non-fatal LLM output truncation for operator visibility (audit/log/metrics).</summary>
public interface ILlmCompletionOutputTruncationReporter
{
    void Report(LlmCompletionOutputTruncationEvent detail);
}
