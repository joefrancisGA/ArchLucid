namespace ArchLucid.Contracts.Abstractions.Agents;

/// <summary>
///     Provider-neutral review-run execution boundary for V1. Production hosts register real agent handlers;
///     tests register deterministic review engines or other doubles.
/// </summary>
/// <remarks>
///     <see cref="IAgentExecutor" /> is the underlying contract; this alias documents the review lifecycle seam without
///     coupling orchestration to Azure OpenAI or any vendor SDK.
/// </remarks>
public interface IReviewEngine : IAgentExecutor;
