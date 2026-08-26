using System.Diagnostics;
using System.Text.Json;

using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.BlobStore;
using ArchLucid.Persistence.Data.Repositories;

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ArchLucid.AgentRuntime;

/// <summary>
///     Blob + inline SQL persistence for full agent trace prompt/response text with mandatory forensic verification.
/// </summary>
public sealed partial class AgentExecutionTraceForensicPersistence(
    IAgentExecutionTraceRepository repository,
    IOptions<AgentExecutionTraceStorageOptions> traceStorageOptions,
    IArtifactBlobStore blobStore,
    IAuditService auditService,
    IScopeContextProvider scopeContextProvider,
    ILogger<AgentExecutionTraceForensicPersistence> logger)
    : IAgentExecutionTraceForensicPersistence
{
    private const string BlobContainerName = "agent-traces";

    private const int MinBlobPersistenceTimeoutSeconds = 5;

    private const int MaxBlobPersistenceTimeoutSeconds = 300;

    private static readonly JsonSerializerOptions AuditJsonOptions =
        new() { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };

    private readonly IAuditService _auditService =
        auditService ?? throw new ArgumentNullException(nameof(auditService));

    private readonly IArtifactBlobStore _blobStore =
        blobStore ?? throw new ArgumentNullException(nameof(blobStore));

    private readonly ILogger<AgentExecutionTraceForensicPersistence> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    private readonly IAgentExecutionTraceRepository _repository =
        repository ?? throw new ArgumentNullException(nameof(repository));

    private readonly IScopeContextProvider _scopeContextProvider =
        scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    private readonly IOptions<AgentExecutionTraceStorageOptions> _traceStorageOptions =
        traceStorageOptions ?? throw new ArgumentNullException(nameof(traceStorageOptions));

    private Task TryPatchInlineForMissingBlobsAsync(
        string traceId,
        string? systemKey,
        string? userKey,
        string? responseKey,
        string systemPrompt,
        string userPrompt,
        string rawResponse,
        AgentType agentType,
        CancellationToken cancellationToken)
    {
        string? systemInline = systemKey is null ? systemPrompt : null;

        string? userInline = userKey is null ? userPrompt : null;

        string? responseInline = responseKey is null ? rawResponse : null;

        if (systemInline is not null)

            RecordPromptInlineFallback(agentType, "system_prompt");

        if (userInline is not null)

            RecordPromptInlineFallback(agentType, "user_prompt");

        if (responseInline is not null)

            RecordPromptInlineFallback(agentType, "response");

        if (systemInline is null && userInline is null && responseInline is null)
            return Task.CompletedTask;

        return _repository.PatchInlinePromptFallbackAsync(
            traceId,
            systemInline,
            userInline,
            responseInline,
            cancellationToken);
    }
}
