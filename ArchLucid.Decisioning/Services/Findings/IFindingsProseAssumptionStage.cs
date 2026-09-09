namespace ArchLucid.Decisioning.Services.Findings;

public interface IFindingsProseAssumptionStage
{
    Task ExecuteAsync(FindingsStageContext context, CancellationToken cancellationToken);
}
