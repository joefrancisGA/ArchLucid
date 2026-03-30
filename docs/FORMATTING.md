# C# formatting (blank lines & layout)

ArchiForge uses **EditorConfig** (repo root `.editorconfig`) so Visual Studio, Rider, and `dotnet format` share the same rules.

Notable choices for **readability**:

- **Blank line between `using` groups** (`dotnet_separate_import_directive_groups = true`), with `System.*` first.
- **Braces** on new lines for types, methods, and control flow (`csharp_new_line_before_open_brace = all`).
- **No squeezed single-line blocks** (`csharp_preserve_single_line_blocks = false`).

## Apply formatting to the whole solution

From the repository root:

```bash
dotnet format ArchiForge.sln
```

Optional: whitespace-only (faster, fewer semantic changes):

```bash
dotnet format ArchiForge.sln --verbosity minimal --verify-no-changes
```

(`--verify-no-changes` is for CI; omit it when you want files updated.)

## Scripts

- **Windows:** `scripts\format-solution.cmd`
- **PowerShell:** `scripts\format-solution.ps1`

Run these on your machine if the IDE’s “Format Document” should match CI/team defaults.

### Simple auto-properties

`dotnet format` does not remove blank lines between adjacent `{ get; set; }` properties. To align with team layout (one line per simple property, **no** empty line between consecutive `get; set;` properties), run:

```bash
python scripts/collapse_simple_properties.py
```

See `.cursor/rules/CSharp-SimpleProperties-OneLine.mdc` for the full convention.
