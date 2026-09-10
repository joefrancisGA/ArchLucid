namespace ArchLucid.Decisioning.Services.Findings;

/// <summary>Post-gate stage that synthesizes Decision-grade findings from checklist clusters (DX-22).</summary>
public interface IFindingsChecklistClusterStage
{
    Task ExecuteAsync(FindingsStageContext context, CancellationToken cancellationToken);
}
