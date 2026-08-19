namespace ArchLucid.Core.Diagnostics;

/// <summary>Host-process build identity (API assembly) for operator diagnostics.</summary>
public interface IHostBuildInfoAccessor
{
    BuildInfoResponse GetBuildInfo();
}
