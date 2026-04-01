using System.Reflection;
using System.Runtime.InteropServices;

namespace ArchiForge.Core.Diagnostics;

/// <summary>
/// Immutable build and runtime facts for a host assembly (API, CLI, workers).
/// Used for startup logs, OpenTelemetry <c>service.version</c>, and support handoffs.
/// </summary>
public sealed record BuildProvenance(
    string InformationalVersion,
    string AssemblyVersion,
    string? FileVersion,
    string RuntimeFrameworkDescription)
{
    /// <summary>
    /// Resolves provenance from <paramref name="assembly"/> (typically the entry or host assembly).
    /// </summary>
    public static BuildProvenance FromAssembly(Assembly assembly)
    {
        ArgumentNullException.ThrowIfNull(assembly);

        AssemblyName name = assembly.GetName();
        string assemblyVersion = name.Version?.ToString() ?? "unknown";

        string informational = assembly.GetCustomAttribute<AssemblyInformationalVersionAttribute>()?.InformationalVersion
                               ?? assemblyVersion;

        string? fileVersion = assembly.GetCustomAttribute<AssemblyFileVersionAttribute>()?.Version;

        return new BuildProvenance(
            informational,
            assemblyVersion,
            fileVersion,
            RuntimeInformation.FrameworkDescription);
    }
}
