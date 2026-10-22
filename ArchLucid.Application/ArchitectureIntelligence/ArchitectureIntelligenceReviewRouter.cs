using Microsoft.Extensions.Options;

namespace ArchLucid.Application.ArchitectureIntelligence;

/// <summary>
///     Feature-flag and runtime gate for LLM-backed Architecture Intelligence review paths.
/// </summary>
internal sealed class ArchitectureIntelligenceReviewRouter : IArchitectureIntelligenceReviewRouter
{
    private readonly IOptionsMonitor<ArchitectureIntelligencePipelineOptions> _options;
    private readonly IArchitectureIntelligenceLlmGateway _gateway;

    public ArchitectureIntelligenceReviewRouter(
        IOptionsMonitor<ArchitectureIntelligencePipelineOptions> options,
        IArchitectureIntelligenceLlmGateway gateway)
    {
        _options = options ?? throw new ArgumentNullException(nameof(options));
        _gateway = gateway ?? throw new ArgumentNullException(nameof(gateway));
    }

    public bool IsLlmReviewEnabled =>
        _options.CurrentValue.UseLlmReview && _gateway.IsClientAvailable;
}
