using System.Buffers;

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

        // Rent a buffer so we can pass ReadOnlyMemory without a lasting ToArray allocation.
        byte[] rented = ArrayPool<byte>.Shared.Rent(bytes.Length);

        try
        {
            bytes.CopyTo(rented);

            return MessagePackSerializer.Deserialize<GraphSnapshot>(
                rented.AsMemory(0, bytes.Length),
                SerializerOptions);
        }
        catch (MessagePackSerializationException)
        {
            return null;
        }
        finally
        {
            ArrayPool<byte>.Shared.Return(rented);
        }
    }
}
