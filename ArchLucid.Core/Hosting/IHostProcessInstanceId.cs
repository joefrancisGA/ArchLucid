namespace ArchLucid.Core.Hosting;

/// <summary>Stable per-process id for SQL lease holders (authority + execute ownership).</summary>
public interface IHostProcessInstanceId
{
    string Value { get; }
}
