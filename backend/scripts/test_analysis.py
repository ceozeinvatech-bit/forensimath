import os
import sys
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
from app.database import get_db
from app.services.evidence_analysis import analyze_scenario
from bson import ObjectId

DB = get_db()

case = DB.cases.find_one({'title': 'RIVERSTONE DEMO'})
if not case:
    print('Test case not found')
    exit(1)
case_id = str(case['_id'])
print('Case id', case_id)

scenarios = list(DB.scenarios.find({'caseId': case_id}))
evidence = list(DB.evidence.find({'caseId': case_id}))
for e in evidence:
    e['id'] = str(e.get('_id'))
    e.pop('_id', None)

for sc in scenarios:
    sc['id'] = str(sc.get('_id'))
    sc.pop('_id', None)
    result = analyze_scenario(sc, evidence)
    print('\nScenario:', sc.get('name'))
    print('Status:', result.get('analysisStatus'))
    print('Counts:', result.get('analysisCounts'))
    print('Gaps:', result.get('analysisGaps'))
    print('Conflicts:', result.get('analysisConflicts'))
    print('\nPer-evidence analysis:')
    for r in result.get('evidenceAnalysis', []):
        print('-', r['evidenceId'], 'status=', r.get('status'), 'missing=', r.get('missingFields'), 'diff=', r.get('difference'))

