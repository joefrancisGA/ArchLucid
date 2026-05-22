namespace ArchLucid.Core.Tests.Diagnostics;

/// <summary>
///     Serializes tests that subscribe to the process-global <see cref="System.Diagnostics.Metrics.Meter" /> named
///     <c>ArchLucid</c>. <see cref="MeterListener.InstrumentPublished" /> runs synchronously while
///     <see cref="ArchLucid.Core.Diagnostics.ArchLucidInstrumentation" /> static fields initialize; parallel tests that
///     reference that type from callbacks cause <see cref="TypeInitializationException" /> flakes.
/// </summary>
[CollectionDefinition("ArchLucidInstrumentation", DisableParallelization = true)]
public sealed class ArchLucidInstrumentationTestCollection : ICollectionFixture<ArchLucidInstrumentationFixture>;
