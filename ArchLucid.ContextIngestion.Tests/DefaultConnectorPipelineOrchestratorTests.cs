using ArchLucid.ContextIngestion.Infrastructure;
using ArchLucid.ContextIngestion.Interfaces;
using ArchLucid.ContextIngestion.Models;
using ArchLucid.ContextIngestion.Services;
using ArchLucid.ContextIngestion.Summaries;

using FluentAssertions;

namespace ArchLucid.ContextIngestion.Tests;

/// <summary>
///     Tests for <see cref="Services.DefaultConnectorPipelineOrchestrator" /> ordering semantics.
/// </summary>
[Trait("Category", "Unit")]
public sealed class DefaultConnectorPipelineOrchestratorTests
{
    [Fact]
    public async Task RunStagesAsync_OrdersDeltaSegmentsByPipelineOrder_NotRegistrationOrder()
    {
        string early = $"EARLY_{Guid.NewGuid():N}";
        string late = $"LATE_{Guid.NewGuid():N}";

        // Registration list deliberately reversed; PipelineOrder must drive delta/summary sequence.
        IReadOnlyList<IConnectorDescriptor> descriptors =
        [
            new ConnectorDescriptor(2, new StubConnector("second", late)),
            new ConnectorDescriptor(1, new StubConnector("first", early))
        ];

        DefaultConnectorPipelineOrchestrator sut = new(descriptors, new DefaultContextDeltaSummaryBuilder());

        ConnectorPipelineStagesOutcome outcome =
            await sut.RunStagesAsync(new ContextIngestionRequest { RunId = Guid.NewGuid(), ProjectId = "p" },
                previousSnapshot: null,
                CancellationToken.None);

        int indexEarly = outcome.DeltaSummary.IndexOf(early, StringComparison.Ordinal);
        int indexLate = outcome.DeltaSummary.IndexOf(late, StringComparison.Ordinal);
        indexEarly.Should().BeGreaterThanOrEqualTo(0);
        indexLate.Should().BeGreaterThanOrEqualTo(0);
        indexEarly.Should().BeLessThan(indexLate);
    }

    private sealed class StubConnector(string connectorType, string deltaSummary) : IContextConnector
    {
        public string ConnectorType => connectorType;

        public Task<RawContextPayload> FetchAsync(ContextIngestionRequest request, CancellationToken ct)
        {
            _ = request;
            _ = ct;
            return Task.FromResult(new RawContextPayload());
        }

        public Task<NormalizedContextBatch> NormalizeAsync(RawContextPayload payload, CancellationToken ct)
        {
            _ = payload;
            _ = ct;
            return Task.FromResult(new NormalizedContextBatch());
        }

        public Task<ContextDelta> DeltaAsync(
            NormalizedContextBatch current,
            ContextSnapshot? previous,
            CancellationToken ct)
        {
            _ = current;
            _ = previous;
            _ = ct;
            return Task.FromResult(new ContextDelta { Summary = deltaSummary });
        }
    }
}
