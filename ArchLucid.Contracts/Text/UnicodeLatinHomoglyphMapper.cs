namespace ArchLucid.Contracts.Text;

/// <summary>
///     Maps Cyrillic and Greek letters that commonly masquerade as Latin in English tokens.
/// </summary>
public static class UnicodeLatinHomoglyphMapper
{
    public static char MapToLatinLookalike(char ch) =>
        ch switch
        {
            '\u0391' => 'A',
            '\u03B1' => 'a',
            '\u0392' => 'B',
            '\u03B2' => 'b',
            '\u0395' => 'E',
            '\u03B5' => 'e',
            '\u0399' => 'I',
            '\u03B9' => 'i',
            '\u039A' => 'K',
            '\u03BA' => 'k',
            '\u039C' => 'M',
            '\u03BC' => 'm',
            '\u039F' => 'O',
            '\u03BF' => 'o',
            '\u03A1' => 'P',
            '\u03C1' => 'p',
            '\u03A4' => 'T',
            '\u03C4' => 't',
            '\u03A5' => 'Y',
            '\u03C5' => 'y',
            '\u03A7' => 'X',
            '\u03C7' => 'x',
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
