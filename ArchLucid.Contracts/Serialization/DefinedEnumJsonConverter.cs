using System.Text.Json;
using System.Text.Json.Serialization;

namespace ArchLucid.Contracts.Serialization;

/// <summary>
///     Deserializes contract enums from enum names or defined integer ordinals with defined-value guards.
/// </summary>
public class DefinedEnumJsonConverter<TEnum> : JsonConverter<TEnum> where TEnum : struct, Enum
{
    protected virtual string ValueLabel => EnumContractLabels.For<TEnum>();

    public override TEnum Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options) =>
        DefinedEnumStringReader.ReadContractEnum<TEnum>(ref reader, ValueLabel);

    public override void Write(Utf8JsonWriter writer, TEnum value, JsonSerializerOptions options) =>
        writer.WriteStringValue(value.ToString());
}
