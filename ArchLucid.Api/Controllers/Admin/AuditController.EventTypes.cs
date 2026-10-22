using System.Reflection;

using ArchLucid.Core.Audit;

using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Admin;

public sealed partial class AuditController
{
    /// <summary>Lists distinct Core <see cref="AuditEventTypes" /> string constants (dropdown support).</summary>
    [HttpGet("event-types")]
    [ProducesResponseType(typeof(IReadOnlyList<string>), StatusCodes.Status200OK)]
    public IActionResult GetEventTypes()
    {
        IReadOnlyList<string> types = typeof(AuditEventTypes)
            .GetFields(BindingFlags.Public | BindingFlags.Static | BindingFlags.FlattenHierarchy)
            .Where(static f => f is { IsLiteral: true, FieldType: { } t } && t == typeof(string))
            .Select(static f => (string)f.GetRawConstantValue()!)
            .OrderBy(static s => s, StringComparer.Ordinal)
            .ToList();

        return Ok(types);
    }
}
