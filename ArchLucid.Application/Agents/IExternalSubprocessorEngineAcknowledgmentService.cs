namespace ArchLucid.Application.Agents;

public interface IExternalSubprocessorEngineAcknowledgmentService
{
    Task<bool> HasWorkspaceAcknowledgmentAsync(CancellationToken cancellationToken);

    Task RecordWorkspaceAcknowledgmentAsync(string actorUserId, CancellationToken cancellationToken);
}
