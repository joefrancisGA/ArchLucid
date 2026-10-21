using System.Collections;
using System.Reflection;

namespace ArchLucid.Api.Tests.Validation;

internal static class ApiRequestNullCollectionProbeFactory
{
    internal static object? TryCreateWithNullCollectionElement(Type requestType, string propertyPath)
    {
        ArgumentNullException.ThrowIfNull(requestType);
        ArgumentException.ThrowIfNullOrWhiteSpace(propertyPath);

        if (requestType.GetConstructor(Type.EmptyTypes) is null)
            return null;

        object instance = Activator.CreateInstance(requestType)!;
        string[] segments = propertyPath.Split('.', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

        if (segments.Length == 0)
            return null;

        object target = instance;

        for (int index = 0; index < segments.Length - 1; index++)
        {
            PropertyInfo? segmentProperty = target.GetType().GetProperty(
                segments[index],
                BindingFlags.Instance | BindingFlags.Public);

            if (segmentProperty is null || !segmentProperty.CanRead || !segmentProperty.CanWrite)
                return null;

            object? nested = segmentProperty.GetValue(target);

            if (nested is null)
            {
                Type nestedType = Nullable.GetUnderlyingType(segmentProperty.PropertyType) ?? segmentProperty.PropertyType;

                if (nestedType.GetConstructor(Type.EmptyTypes) is null)
                    return null;

                nested = Activator.CreateInstance(nestedType)!;
                segmentProperty.SetValue(target, nested);
            }

            target = nested!;
        }

        PropertyInfo? collectionProperty = target.GetType().GetProperty(
            segments[^1],
            BindingFlags.Instance | BindingFlags.Public);

        if (collectionProperty is null || !collectionProperty.CanWrite)
            return null;

        object? collectionWithNull = CreateCollectionWithNullElement(collectionProperty.PropertyType);

        if (collectionWithNull is null)
            return null;

        collectionProperty.SetValue(target, collectionWithNull);

        return instance;
    }

    internal static object? TryCreateWithNullCollectionProperty(Type requestType, string propertyPath)
    {
        ArgumentNullException.ThrowIfNull(requestType);
        ArgumentException.ThrowIfNullOrWhiteSpace(propertyPath);

        if (requestType.GetConstructor(Type.EmptyTypes) is null)
            return null;

        object instance = Activator.CreateInstance(requestType)!;
        string[] segments = propertyPath.Split('.', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

        if (segments.Length == 0)
            return null;

        object target = instance;

        for (int index = 0; index < segments.Length - 1; index++)
        {
            PropertyInfo? segmentProperty = target.GetType().GetProperty(
                segments[index],
                BindingFlags.Instance | BindingFlags.Public);

            if (segmentProperty is null || !segmentProperty.CanRead || !segmentProperty.CanWrite)
                return null;

            object? nested = segmentProperty.GetValue(target);

            if (nested is null)
            {
                Type nestedType = Nullable.GetUnderlyingType(segmentProperty.PropertyType) ?? segmentProperty.PropertyType;

                if (nestedType.GetConstructor(Type.EmptyTypes) is null)
                    return null;

                nested = Activator.CreateInstance(nestedType)!;
                segmentProperty.SetValue(target, nested);
            }

            target = nested!;
        }

        PropertyInfo? collectionProperty = target.GetType().GetProperty(
            segments[^1],
            BindingFlags.Instance | BindingFlags.Public);

        if (collectionProperty is null || !collectionProperty.CanWrite)
            return null;

        collectionProperty.SetValue(target, null);

        if (collectionProperty.GetValue(target) is not null)
            return null;

        return instance;
    }

    private static object? CreateCollectionWithNullElement(Type collectionType)
    {
        Type? elementType = TryGetEnumerableElementType(collectionType);

        if (elementType is null)
            return null;

        if (elementType.IsValueType)
            return null;

        if (collectionType.IsArray)
        {
            Array array = Array.CreateInstance(elementType, 1);
            array.SetValue(null, 0);

            return array;
        }

        Type listType = typeof(List<>).MakeGenericType(elementType);
        IList list = (IList)Activator.CreateInstance(listType)!;
        list.Add(null);

        if (collectionType.IsAssignableFrom(listType))
            return list;

        if (collectionType.IsAssignableFrom(typeof(IReadOnlyList<>).MakeGenericType(elementType)))
            return list;

        if (collectionType.IsAssignableFrom(typeof(ICollection<>).MakeGenericType(elementType)))
            return list;

        if (collectionType.IsAssignableFrom(typeof(IEnumerable<>).MakeGenericType(elementType)))
            return list;

        return list;
    }

    private static Type? TryGetEnumerableElementType(Type collectionType)
    {
        if (collectionType.IsArray)
            return collectionType.GetElementType();

        Type? enumerableInterface = collectionType
            .GetInterfaces()
            .Concat([collectionType])
            .FirstOrDefault(static type =>
                type.IsGenericType && type.GetGenericTypeDefinition() == typeof(IEnumerable<>));

        return enumerableInterface?.GetGenericArguments()[0];
    }
}
