using System.Runtime.CompilerServices;

using ArchLucid.Core.Diagnostics;

namespace ArchLucid.Core.Tests.Diagnostics;

/// <summary>
///     Eagerly initializes instrumentation types before any test registers global metric or activity listeners.
/// </summary>
internal static class ArchLucidInstrumentationAssemblyInitializer
{
    [ModuleInitializer]
    internal static void EagerInitialize()
    {
        RuntimeHelpers.RunClassConstructor(typeof(ArchLucidInstrumentation).TypeHandle);
        RuntimeHelpers.RunClassConstructor(typeof(ArchLucidActivitySources).TypeHandle);
    }
}
