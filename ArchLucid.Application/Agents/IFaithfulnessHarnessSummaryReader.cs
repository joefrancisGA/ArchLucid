namespace ArchLucid.Application.Agents;

public interface IFaithfulnessHarnessSummaryReader
{
    Task<FaithfulnessHarnessSummary?> TryReadLatestAsync(CancellationToken cancellationToken);
}
