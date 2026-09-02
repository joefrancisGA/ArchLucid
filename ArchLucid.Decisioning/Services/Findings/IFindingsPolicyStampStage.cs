namespace ArchLucid.Decisioning.Services.Findings;

/// <summary>Findings pipeline policy-expectation stamp stage.</summary>
public interface IFindingsPolicyStampStage
{
    Task ExecuteAsync(FindingsStageContext context, CancellationToken cancellationToken);
}
