import json

file_path = '/Users/yashjaiswal/Downloads/AI Build Project/TradeZilla/src/components/ChartDrawingOverlay.tsx'

with open('edits.json', 'r') as f:
    edits = json.load(f)

with open(file_path, 'r') as f:
    content = f.read()

# Apply edits in order, but skip the last 3 (the bad multi_replace_file_content)
for i, edit in enumerate(edits[:-3]):
    target = edit['target']
    replacement = edit['replacement']
    if target in content:
        content = content.replace(target, replacement)
        print(f"Applied edit {i}")
    else:
        print(f"Failed to find target for edit {i}")

with open(file_path, 'w') as f:
    f.write(content)

