using System.Text.Json;
using System.Text.Json.Serialization.Metadata;

using ArchLucid.Contracts.Persistence.Graph;

namespace ArchLucid.Core.Persistence.Serialization;

/// <summary>
///     Shared JSON options for graph node/edge payloads and full <see cref="GraphSnapshot" /> projection cache bytes.
/// </summary>
public static class GraphJsonSerialization
{
    private static readonly GraphJsonSerializerContext SerializerContext = CreateSerializerContext();

    /// <summary>
    ///     Options for list/graph DTO persistence (case-insensitive reads; canonical node/edge converters).
    /// </summary>
    public static JsonSerializerOptions EntityJsonOptions
    {
        get;
    } = CreateEntityJsonOptions();

    /// <summary>
    ///     Options for distributed projection cache round-trip of entire <see cref="GraphSnapshot" /> documents.
    /// </summary>
    public static JsonSerializerOptions SnapshotProjectionOptions
    {
        get;
    } = CreateSnapshotProjectionOptions();

    /// <summary>Source-generated context bound to <see cref="EntityJsonOptions" />.</summary>
    public static GraphJsonSerializerContext Context
    {
        get;
    } = SerializerContext;

    public static byte[] SerializeSnapshotToUtf8Bytes(GraphSnapshot snapshot)
    {
        ArgumentNullException.ThrowIfNull(snapshot);

        return JsonSerializer.SerializeToUtf8Bytes(snapshot, SnapshotProjectionOptions);
    }

    public static GraphSnapshot? DeserializeSnapshot(ReadOnlySpan<byte> utf8Json)
    {
        try
        {
            return JsonSerializer.Deserialize(utf8Json, SerializerContext.GraphSnapshot);
        }
        catch (JsonException)
        {
            return null;
        }
    }

    private static GraphJsonSerializerContext CreateSerializerContext()
    {
        JsonSerializerOptions options = new()
        {
            PropertyNameCaseInsensitive = true,
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            WriteIndented = false,
        };

        options.Converters.Add(new GraphNodeJsonConverter());
        options.Converters.Add(new GraphEdgeJsonConverter());

        GraphJsonSerializerContext context = new(options);
        options.MakeReadOnly();

        return context;
    }

    private static JsonSerializerOptions CreateEntityJsonOptions()
    {
        JsonSerializerOptions options = new()
        {
            PropertyNameCaseInsensitive = true,
            WriteIndented = false,
            TypeInfoResolver = JsonTypeInfoResolver.Combine(
                SerializerContext,
                new DefaultJsonTypeInfoResolver()),
        };

        options.Converters.Add(new GraphNodeJsonConverter());
        options.Converters.Add(new GraphEdgeJsonConverter());
        options.MakeReadOnly();

        return options;
    }

    private static JsonSerializerOptions CreateSnapshotProjectionOptions()
    {
        JsonSerializerOptions options = new(EntityJsonOptions)
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        };

        options.MakeReadOnly();

        return options;
    }
}

