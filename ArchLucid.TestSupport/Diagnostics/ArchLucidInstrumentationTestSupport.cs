using System.Runtime.CompilerServices;

using ArchLucid.Core.Diagnostics;

namespace ArchLucid.TestSupport.Diagnostics;

/// <summary>Test-only helpers for safe access to <see cref="ArchLucidInstrumentation" /> under xUnit parallelism.</summary>
public static class ArchLucidInstrumentationTestSupport
{
    /// <inheritdoc cref="ArchLucidMeterNames.Meter" />
    public static string MeterName => ArchLucidMeterNames.Meter;

    private static readonly Lock InitGate = new();

    private static volatile bool _initialized;

    /// <summary>Completes one-time static initialization before starting a <see cref="MeterListener" />.</summary>
    public static void EnsureInitialized()
    {
        if (_initialized)
            return;

        lock (InitGate)
        {
            if (_initialized)
                return;

            RuntimeHelpers.RunClassConstructor(typeof(ArchLucidInstrumentation).TypeHandle);
            RuntimeHelpers.RunClassConstructor(typeof(ArchLucidActivitySources).TypeHandle);
            _initialized = true;
        }
    }
}
