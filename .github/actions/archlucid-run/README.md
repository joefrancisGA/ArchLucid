# ArchLucid Run GitHub Action

This action triggers an ArchLucid architecture run from a brief file and commits the result.

## Usage

```yaml
steps:
  - uses: actions/checkout@v4
  - name: Run ArchLucid
    uses: ./.github/actions/archlucid-run
    with:
      api-url: 'https://api.archlucid.net'
      api-key: ${{ secrets.ARCHLUCID_API_KEY }}
      brief-path: 'docs/architecture/brief.md'
```
