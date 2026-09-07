namespace ArchLucid.Decisioning.Services.Findings;

/// <summary>Invokes the optional Premium insight-generator pass after typed engines (DX-10).</summary>
public interface IFindingsInsightGeneratorStage
{
    Task ExecuteAsync(FindingsStageContext context, CancellationToken cancellationToken);
}
