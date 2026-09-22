namespace ArchLucid.Application.Runs;

/// <summary>
///     Captures Working Career vs Rehearsal door onto the run header at first execute start (CG-019).
///     Structural execution mode already lives on the run; this stamp freezes the Working door.
/// </summary>
public interface IExecuteTimeCareerPostureCaptureService
{
    Task TryCaptureAndPersistAsync(string runId, CancellationToken cancellationToken = default);
}
