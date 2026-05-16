import os
import re

def update_spine_links():
    for root, dirs, files in os.walk('.'):
        for ignore in ['node_modules', 'bin', 'obj', '.git', '.next', 'dist']:
            if ignore in dirs:
                dirs.remove(ignore)
            
        for file in files:
            if file.endswith('.md') or file.endswith('.mdc'):
                filepath = os.path.join(root, file).replace('\\', '/')
                if filepath.startswith('./'):
                    filepath = filepath[2:]
                    
                try:
                    with open(filepath, 'r', encoding='utf-8') as f:
                        content = f.read()
                except UnicodeDecodeError:
                    continue
                    
                depth = filepath.count('/')
                if filepath.startswith('docs/'):
                    if depth == 1:
                        rel_path = 'START_HERE.md'
                    else:
                        rel_path = '../' * (depth - 1) + 'START_HERE.md'
                elif filepath.startswith('dist/'):
                    rel_path = '../' * depth + 'docs/START_HERE.md'
                else:
                    rel_path = '../' * depth + 'docs/START_HERE.md'
                    if depth == 0:
                        rel_path = 'docs/START_HERE.md'
                        
                new_content = re.sub(
                    r'> \*\*Spine doc:\*\* \[Five-document onboarding spine\]\([^)]+\)\.?(?: Read this file only if you have a specific reason beyond those five entry documents\.)?',
                    f'> **Spine doc:** [`START_HERE.md`]({rel_path}).',
                    content
                )
                
                if new_content != content:
                    with open(filepath, 'w', encoding='utf-8') as f:
                        f.write(new_content)
                    print(f"Updated {filepath}")

if __name__ == '__main__':
    update_spine_links()
