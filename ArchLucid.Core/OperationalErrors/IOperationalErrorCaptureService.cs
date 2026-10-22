namespace ArchLucid.Core.OperationalErrors;

/// <summary>Fire-and-forget operational error capture; never throws to callers.</summary>
public interface IOperationalErrorCaptureService
{
    void TryCapture(OperationalErrorCaptureRequest request);
}
