import re

with open(r'c:\ArchLucid\ArchLucid\ArchLucid.Core\Configuration\ConfigurationKeyCatalog.cs', 'r', encoding='utf-8') as f:
    catalog_code = f.read()

with open(r'c:\ArchLucid\ArchLucid\docs\library\CONFIGURATION_REFERENCE.md', 'r', encoding='utf-8') as f:
    doc_text = f.read()

matches = re.findall(r'E\([^,]*,\s*"([^"]+)"', catalog_code)
for key in matches:
    if f"`{key}`" not in doc_text:
        print(f"Missing in doc: {key}")
