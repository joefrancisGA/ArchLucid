namespace ArchLucid.Integrations.AzureDevOps.Tests.Support;

/// <summary>No-op scope so <see cref="RecordingLogger{T}" /> can satisfy <c>BeginScope</c> without tracking state.</summary>
internal sealed class NullLogScope : IDisposable
{
    internal static readonly NullLogScope Instance = new();

    private NullLogScope()
    {
    }

    public void Dispose()
    {
    }
}
