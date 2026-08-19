namespace ArchLucid.Host.Composition.Tests;

/// <summary>
/// Serializes <see cref="StartupConfigWarningsInstrumentationTests" /> — <see cref="System.Diagnostics.Metrics.MeterListener" />
/// observes process-global counter recordings, so parallel tests that emit the same instrument cause flaky assertions.
/// </summary>
[CollectionDefinition("StartupConfigWarningsInstrumentation", DisableParallelization = true)]
public sealed class StartupConfigWarningsInstrumentationCollection;
