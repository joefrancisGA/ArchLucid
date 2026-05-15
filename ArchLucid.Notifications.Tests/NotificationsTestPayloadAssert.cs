using System.Reflection;

using FluentAssertions;

namespace ArchLucid.Notifications.Tests;

internal static class NotificationsTestPayloadAssert
{
    internal static string GetStringProperty(object target, string propertyName)
    {
        PropertyInfo? prop = target.GetType().GetProperty(propertyName, BindingFlags.Public | BindingFlags.Instance);

        prop.Should().NotBeNull();

        object? value = prop!.GetValue(target);

        value.Should().NotBeNull();

        return value!.ToString()!;
    }
}
