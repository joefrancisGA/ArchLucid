using System.Diagnostics.CodeAnalysis;
using System.Text.Json;

using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Persistence.Data.Repositories;

using Microsoft.Azure.Cosmos;
using Microsoft.Extensions.Options;

namespace ArchLucid.Persistence.Cosmos;

/// <summary>Cosmos-backed <see cref="IAgentExecutionTraceRepository" />.</summary>
/// <remarks>
///     Implementation lives in <c>CosmosAgentExecutionTraceRepository.{Patch|Query}.cs</c> partials.
///     The type remains one <see cref="IAgentExecutionTraceRepository" /> implementation and DI registration.
/// </remarks>
[ExcludeFromCodeCoverage(Justification = "Requires Cosmos account or emulator.")]
public sealed partial class CosmosAgentExecutionTraceRepository(
    CosmosClientFactory clientFactory,
    IOptionsMonitor<CosmosDbOptions> optionsMonitor) : IAgentExecutionTraceRepository
{
    private const string ContainerId = "agent-traces";

    /// <summary>Caps concurrent single-partition slice queries so a wide scan cannot saturate provisioned RUs.</summary>
    private const int LlmCostSliceFanOutMaxConcurrent = 6;

    private readonly CosmosClientFactory _clientFactory =
        clientFactory ?? throw new ArgumentNullException(nameof(clientFactory));

    private readonly IOptionsMonitor<CosmosDbOptions> _optionsMonitor =
        optionsMonitor ?? throw new ArgumentNullException(nameof(optionsMonitor));

    /// <inheritdoc />
    public async Task CreateAsync(AgentExecutionTrace trace, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(trace);

        Container container = await _clientFactory.GetContainerAsync(ContainerId, cancellationToken);
        CosmosDbOptions opts = _optionsMonitor.CurrentValue;
        string json = JsonSerializer.Serialize(trace, ContractJson.Default);
        int? ttl = opts.AgentTraceTtlSeconds > 0 ? opts.AgentTraceTtlSeconds : null;

        AgentTraceDocument doc = CosmosAgentTraceDocumentMapper.BuildDocument(trace, json, ttl);

        await container.CreateItemAsync(doc, new PartitionKey(trace.RunId), cancellationToken: cancellationToken);
    }

    /// <inheritdoc />
    public Task<int> HardDeleteTracesArchivedBeforeAsync(
        DateTimeOffset archivedBeforeUtc,
        int maxRows,
        CancellationToken cancellationToken = default)
    {
        _ = archivedBeforeUtc;
        _ = maxRows;
        cancellationToken.ThrowIfCancellationRequested();

        return Task.FromResult(0);
    }
}
