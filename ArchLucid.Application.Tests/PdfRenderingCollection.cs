namespace ArchLucid.Application.Tests;

/// <summary>
/// Serializes native-backed PDF rendering tests and excludes parallel test collections
/// while a renderer is active. Keeps their assertions enabled under fast-core CI.
/// </summary>
[CollectionDefinition("PdfRendering", DisableParallelization = true)]
public sealed class PdfRenderingCollection;
