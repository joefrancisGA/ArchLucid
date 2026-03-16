using Microsoft.Extensions.Options;

namespace ArchiForge.Application.Analysis;

public sealed class DefaultConsultingDocxTemplateOptionsProvider : IConsultingDocxTemplateOptionsProvider
{
    private readonly IOptions<ConsultingDocxTemplateOptions> _options;

    public DefaultConsultingDocxTemplateOptionsProvider(IOptions<ConsultingDocxTemplateOptions> options)
    {
        _options = options;
    }

    public ConsultingDocxTemplateOptions GetOptions()
    {
        return _options.Value;
    }
}

