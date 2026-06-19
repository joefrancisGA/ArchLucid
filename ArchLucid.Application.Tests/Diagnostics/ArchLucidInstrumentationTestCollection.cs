using ArchLucid.TestSupport.Diagnostics;

namespace ArchLucid.Application.Tests.Diagnostics;

/// <summary>
///     Serializes Application.Tests that subscribe to global <see cref="System.Diagnostics.ActivitySource" /> listeners.
/// </summary>
[CollectionDefinition("ArchLucidInstrumentation", DisableParallelization = true)]
public sealed class ArchLucidInstrumentationTestCollection : ICollectionFixture<ArchLucidInstrumentationFixture>;

/// <summary>Eagerly completes instrumentation static initialization before activity listeners attach.</summary>
public sealed class ArchLucidInstrumentationFixture
{
    public ArchLucidInstrumentationFixture()
    {
        ArchLucidInstrumentationTestSupport.EnsureInitialized();
    }
}
