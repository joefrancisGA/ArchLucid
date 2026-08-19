using System.Data;

using ArchLucid.Contracts.Common;

using Dapper;

namespace ArchLucid.Persistence.Data.Infrastructure;

/// <summary>Maps <see cref="StructuralExecutionMode" /> to <c>NVARCHAR</c> values on <c>dbo.Runs</c>.</summary>
public sealed class StructuralExecutionModeTypeHandler : SqlMapper.TypeHandler<StructuralExecutionMode>
{
    private static bool _registered;

    public static void Register()
    {
        if (_registered)
            return;

        SqlMapper.AddTypeHandler(new StructuralExecutionModeTypeHandler());
        _registered = true;
    }

    public override StructuralExecutionMode Parse(object value)
    {
        if (value is null or DBNull)
            throw new DataException("StructuralExecutionMode cannot be null.");

        string text = value.ToString()?.Trim() ?? "";

        return !Enum.TryParse(text, ignoreCase: false, out StructuralExecutionMode parsed) ? throw new DataException($"Unrecognised StructuralExecutionMode '{text}'.") : parsed;
    }

    public override void SetValue(IDbDataParameter parameter, StructuralExecutionMode value)
    {
        parameter.Value = value.ToString();
    }
}
