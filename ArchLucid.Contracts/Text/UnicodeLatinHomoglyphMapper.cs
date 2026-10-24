namespace ArchLucid.Contracts.Text;

/// <summary>
///     Maps Cyrillic letters that commonly masquerade as Latin in English tokens.
/// </summary>
public static class UnicodeLatinHomoglyphMapper
{
    public static char MapToLatinLookalike(char ch) =>
        ch switch
        {
            '\u0410' => 'A',
            '\u0430' => 'a',
            '\u0415' => 'E',
            '\u0435' => 'e',
            '\u041C' => 'M',
            '\u043C' => 'm',
            '\u041E' => 'O',
            '\u043E' => 'o',
            '\u0420' => 'P',
            '\u0440' => 'p',
            '\u0421' => 'C',
            '\u0441' => 'c',
            '\u0423' => 'Y',
            '\u0443' => 'y',
            '\u0425' => 'X',
            '\u0445' => 'x',
            '\u0406' => 'I',
            '\u0456' => 'i',
            _ => ch,
        };
}
