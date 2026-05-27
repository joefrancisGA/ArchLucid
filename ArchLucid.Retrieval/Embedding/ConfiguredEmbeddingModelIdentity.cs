using Microsoft.Extensions.Options;

namespace ArchLucid.Retrieval.Embedding;

/// <summary>
///     Reads <see cref="RetrievalEmbeddingModelOptions" /> as the active embedding identity.
/// </summary>
public sealed class ConfiguredEmbeddingModelIdentity(IOptionsMonitor<RetrievalEmbeddingModelOptions> options)
    : IEmbeddingModelIdentity
{
    private readonly IOptionsMonitor<RetrievalEmbeddingModelOptions> _options =
        options ?? throw new ArgumentNullException(nameof(options));

    /// <inheritdoc />
    public string ModelId => _options.CurrentValue.ModelId;

    /// <inheritdoc />
    public int ExpectedDimension => _options.CurrentValue.ExpectedDimension;
}
