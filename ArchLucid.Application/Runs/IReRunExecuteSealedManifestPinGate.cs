namespace ArchLucid.Application.Runs;

public interface IReRunExecuteSealedManifestPinGate
{
    Task EnsureReadyAsync(string runId, CancellationToken cancellationToken = default);
}
