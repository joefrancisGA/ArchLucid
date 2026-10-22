using ArchLucid.Application.Planning.AdvisoryDraft;
using ArchLucid.Contracts.Requests;

namespace ArchLucid.Application.Planning.Stages;

public interface IArchitectureRequestDraftExtractStage
{
    Task<ArchitectureRequestDraftExtractionResult> ExtractAsync(
        DraftArchitectureRequestInput input,
        IArchitectureRequestDraftProgress? progress,
        CancellationToken cancellationToken);
}

public sealed class ArchitectureRequestDraftExtractionResult
{
    public string[] NormalizedConstraints
    {
        get;
        init;
    } = [];

    public string[] NormalizedAssumptions
    {
        get;
        init;
    } = [];

    public string[] SuggestedCapabilities
    {
        get;
        init;
    } = [];

    public string[] TopologyHints
    {
        get;
        init;
    } = [];

    public string[] SecurityBaselineHints
    {
        get;
        init;
    } = [];

    public string? SuggestedFailureModeNote
    {
        get;
        init;
    }

    public string[] ExistingConstraints
    {
        get;
        init;
    } = [];

    public string[] ExistingAssumptions
    {
        get;
        init;
    } = [];

    public double ExtractionMs
    {
        get;
        init;
    }
}
