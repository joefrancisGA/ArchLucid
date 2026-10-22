namespace ArchLucid.Decisioning.Services.Findings;

/// <summary>Post-gate stage that joins Decision-grade findings sharing a graph node (DX-51).</summary>
public interface IFindingsDecisionGradeFusionStage
{
    Task ExecuteAsync(FindingsStageContext context, CancellationToken cancellationToken);
}
