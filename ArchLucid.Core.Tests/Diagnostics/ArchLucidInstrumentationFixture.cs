namespace ArchLucid.Core.Tests.Diagnostics;

/// <summary>Eagerly completes <see cref="ArchLucid.Core.Diagnostics.ArchLucidInstrumentation" /> static initialization for collection tests.</summary>
public sealed class ArchLucidInstrumentationFixture
{
    public ArchLucidInstrumentationFixture()
    {
        ArchLucidInstrumentationTestSupport.EnsureInitialized();
    }
}
