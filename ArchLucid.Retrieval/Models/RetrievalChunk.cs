namespace ArchLucid.Retrieval.Models;

/// <summary>
///     Indexed unit stored in <see cref="ArchLucid.Retrieval.Indexing.IVectorIndex" /> (text slice + embedding + scope
///     metadata).
/// </summary>
/// <remarks>
///     Produced by <see cref="ArchLucid.Retrieval.Indexing.RetrievalIndexingService" /> from
///     <see cref="RetrievalDocument" />.
/// </remarks>
public class RetrievalChunk
{
    public string ChunkId
    {
        get;
        set;
    } = null!;

    public string DocumentId
    {
        get;
        set;
    } = null!;

    public Guid TenantId
    {
        get;
        set;
    }

    public Guid WorkspaceId
    {
        get;
        set;
    }

    public Guid ProjectId
    {
        get;
        set;
    }

    public Guid? RunId
    {
        get;
        set;
    }

    public Guid? ManifestId
    {
        get;
        set;
    }

    public CorpusKind CorpusKind
    {
        get;
        set;
    } = CorpusKind.Conversation;

    public string SourceType
    {
        get;
        set;
    } = null!;

    public string SourceId
    {
        get;
        set;
    } = null!;

    public string Title
    {
        get;
        set;
    } = null!;

    /// <summary>Chunk text (substring of document content).</summary>
    public string Text
    {
        get;
        set;
    } = null!;

    /// <summary>Zero-based order within the parent document.</summary>
    public int ChunkOrdinal
    {
        get;
        set;
    }

    /// <summary>Dense embedding aligned with <see cref="Text" />.</summary>
    public float[] Embedding
    {
        get;
        set;
    } = [];

    /// <summary>Embedding deployment id stamped at index time (TB-045).</summary>
    public string? EmbeddingModelId
    {
        get;
        set;
    }

    /// <summary>Embedding vector length stamped at index time (TB-045).</summary>
    public int EmbeddingDimension
    {
        get;
        set;
    }

    public DateTime CreatedUtc
    {
        get;
        set;
    } = TimeProvider.System.UtcNowDateTime();

    /// <summary>Policy-pack corpus rule-pack id when <see cref="CorpusKind" /> is PolicyPack.</summary>
    public string? PolicyPackRulePackId
    {
        get;
        set;
    }

    public string? DecisionId
    {
        get;
        set;
    }

    public string? FindingId
    {
        get;
        set;
    }

    /// <summary>Document content hash stamped at index time (TB-046).</summary>
    public string? ContentHash
    {
        get;
        set;
    }

    /// <summary>Chunking strategy fingerprint stamped at index time (TB-047).</summary>
    public string? ChunkingFingerprint
    {
        get;
        set;
    }

    /// <summary>UTC timestamp when this chunk was last indexed.</summary>
    public DateTime? LastIndexedUtc
    {
        get;
        set;
    }
}
