import json

log_path = '/Users/yashjaiswal/.gemini/antigravity-ide/brain/ab07324b-7b44-4b70-a311-6189674366a7/.system_generated/logs/transcript_full.jsonl'

edits = []

with open(log_path, 'r') as f:
    for line in f:
        data = json.loads(line)
        if 'tool_calls' in data:
            for call in data['tool_calls']:
                if call['name'] in ['multi_replace_file_content', 'replace_file_content']:
                    args = call['args']
                    target_file = args.get('TargetFile', '')
                    if 'ChartDrawingOverlay.tsx' in target_file:
                        if call['name'] == 'replace_file_content':
                            edits.append({
                                'target': args['TargetContent'],
                                'replacement': args['ReplacementContent']
                            })
                        else:
                            chunks = args['ReplacementChunks']
                            if isinstance(chunks, str):
                                chunks = json.loads(chunks)
                            for chunk in chunks:
                                edits.append({
                                    'target': chunk['TargetContent'],
                                    'replacement': chunk['ReplacementContent']
                                })

print(f"Found {len(edits)} edits.")
with open('edits.json', 'w') as out:
    json.dump(edits, out, indent=2)

