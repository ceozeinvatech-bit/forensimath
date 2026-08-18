import sys, os
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
from app.database import get_db
DB = get_db()
case = DB.cases.find_one({'title':'RIVERSTONE SPATIAL TEST'})
if not case:
    print('Case not found')
    sys.exit(1)
print('case id', str(case['_id']))
for e in DB.evidence.find({'caseId': str(case['_id'])}):
    print('evidence:', e.get('label'), 'pos=', e.get('position'))
for s in DB.scenarios.find({'caseId': str(case['_id'])}):
    print('scenario:', s.get('name'), 'points=', s.get('pathPoints'))
