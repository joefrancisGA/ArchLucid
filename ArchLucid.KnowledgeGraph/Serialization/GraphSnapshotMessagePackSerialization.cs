using ArchLucid.KnowledgeGraph.Models;

using MessagePack;
using MessagePack.Resolvers;

namespace ArchLucid.KnowledgeGraph.Serialization;

/// <summary>MessagePack projection cache bytes (LZ4-compressed) for distributed <see cref="Interfaces.IGraphSnapshotProjectionCache" />.</summary>
public static class GraphSnapshotMessagePackSerialization
{
    private static readonly MessagePackSerializerOptions SerializerOptions = MessagePackSerializerOptions.Standard
        .WithCompression(MessagePackCompression.Lz4BlockArray)
        .WithResolver(CompositeResolver.Create(
            StandardResolverAllowPrivate.Instance,
            ContractlessStandardResolverAllowPrivate.Instance));

    public static byte[] SerializeSnapshot(GraphSnapshot snapshot)
    {
        ArgumentNullException.ThrowIfNull(snapshot);

        return MessagePackSerializer.Serialize(snapshot, SerializerOptions);
    }

    public static GraphSnapshot? DeserializeSnapshot(ReadOnlySpan<byte> bytes)
    {
        if (bytes.Length == 0)
            return null;

        try
        {
            return MessagePackSerializer.Deserialize<GraphSnapshot>(bytes.ToArray(), SerializerOptions);
        }
        catch (MessagePackSerializationException)
        {
            return null;
        }
    }
}
