using System.Globalization;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace ArchLucid.Api.Serialization;

/// <summary>Preserves the existing enum wire format while rejecting undefined enum values on read.</summary>
internal sealed class ValidatedEnumJsonConverterFactory(JsonStringEnumConverter inner) : JsonConverterFactory
{
    private readonly JsonStringEnumConverter _inner = inner ?? throw new ArgumentNullException(nameof(inner));

    public override bool CanConvert(Type typeToConvert) => _inner.CanConvert(typeToConvert);

    public override JsonConverter CreateConverter(Type typeToConvert, JsonSerializerOptions options)
    {
        JsonConverter converter = _inner.CreateConverter(typeToConvert, options);
        return (JsonConverter)Activator.CreateInstance(
            typeof(ValidatedEnumConverter<>).MakeGenericType(typeToConvert), converter)!;
    }

    private sealed class ValidatedEnumConverter<TEnum>(JsonConverter<TEnum> inner) : JsonConverter<TEnum>
        where TEnum : struct, Enum
    {
        private static readonly bool IsFlags = typeof(TEnum).IsDefined(typeof(FlagsAttribute), inherit: false);
        private static readonly ulong AllowedBits = IsFlags
            ? Enum.GetValues<TEnum>().Aggregate(0UL, static (mask, value) => mask | Bits(value))
            : 0UL;

        public override TEnum Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
        {
            RejectCompositeOrdinaryEnum(ref reader);
            return Validate(inner.Read(ref reader, typeToConvert, options));
        }

        public override TEnum ReadAsPropertyName(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
        {
            RejectCompositeOrdinaryEnum(ref reader);
            return Validate(inner.ReadAsPropertyName(ref reader, typeToConvert, options));
        }

        // Keep established response serialization, including legacy sentinel values, byte-compatible.
        public override void Write(Utf8JsonWriter writer, TEnum value, JsonSerializerOptions options) =>
            inner.Write(writer, value, options);

        public override void WriteAsPropertyName(Utf8JsonWriter writer, TEnum value, JsonSerializerOptions options) =>
            inner.WriteAsPropertyName(writer, value, options);

        private static void RejectCompositeOrdinaryEnum(ref Utf8JsonReader reader)
        {
            if (!IsFlags && reader.TokenType is JsonTokenType.String or JsonTokenType.PropertyName
                && reader.GetString()?.Contains(',') == true)
            {
                throw new JsonException($"Composite values are not valid for {typeof(TEnum).Name}.");
            }
        }

        private static TEnum Validate(TEnum value)
        {
            bool valid = IsFlags ? (Bits(value) & ~AllowedBits) == 0 : Enum.IsDefined(value);

            return valid ? value : throw new JsonException($"Undefined {typeof(TEnum).Name} value.");
        }

        private static ulong Bits(TEnum value)
        {
            TypeCode code = Type.GetTypeCode(Enum.GetUnderlyingType(typeof(TEnum)));
            return code is TypeCode.SByte or TypeCode.Int16 or TypeCode.Int32 or TypeCode.Int64
                ? unchecked((ulong)Convert.ToInt64(value, CultureInfo.InvariantCulture))
                : Convert.ToUInt64(value, CultureInfo.InvariantCulture);
        }
    }
}
