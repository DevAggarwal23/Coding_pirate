import json
from services.matcher_service import match_schemes

with open('data/schemes.json', 'r', encoding='utf-8') as f:
    schemes = json.load(f)

profile = {
    'category': 'SC',
    'income': 300000,
    'state': 'Uttar Pradesh',
    'business_type': 'dairy',
    'project_cost': 500000,
    'intent': 'financial_assistance'
}

res = match_schemes(profile, schemes)
print('Auto-matched count:', len(res['auto_matched']))
for i, s in enumerate(res['auto_matched'][:5], 1):
    name = s['scheme_name']
    score = s['confidence']
    why = s['why_matched']
    print(f"{i}. {name} (score={score})")
    print(f"   Why: {why}")

print('\nBorderline count:', len(res['borderline']))
for s in res['borderline'][:3]:
    name = s['scheme_name']
    reason = s['reason']
    print(f"   - {name}: {reason}")
