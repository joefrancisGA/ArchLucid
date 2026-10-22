using ArchLucid.Api.Formatters;

using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;

namespace ArchLucid.Api.Startup;

internal sealed class AuditCsvFormatterMvcOptionsConfigurer : IConfigureOptions<MvcOptions>
{
    private readonly AuditEventCsvFormatter _formatter;

    public AuditCsvFormatterMvcOptionsConfigurer(AuditEventCsvFormatter formatter)
    {
        _formatter = formatter ?? throw new ArgumentNullException(nameof(formatter));
    }

    public void Configure(MvcOptions options)
    {
        ArgumentNullException.ThrowIfNull(options);

        options.OutputFormatters.Add(_formatter);
    }
}
