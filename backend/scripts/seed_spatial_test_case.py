"""
Idempotent seed script for RIVERSTONE SPATIAL TEST.
Creates case, evidence, measurements, and three deterministic scenarios.
"""
from datetime import datetime
from bson import ObjectId
import os
import sys

sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
from app.database import get_db

DB = get_db()

CASE_TITLE = 'RIVERSTONE SPATIAL TEST'

EVIDENCE = [
    {
        'label': 'E-01',
        'type': 'Footwear Impression',
        'description': 'Simulated footprint E-01',
        'position': {'x': 100, 'y': 0, 'z': 100},
        'measurements': {
            'direction': 'NE',
            'timestamp': '2026-08-18T18:10:00',
            'length': '265 mm',
            'width': '96 mm',
        }
    },
    {
        'label': 'E-02',
        'type': 'Object',
        'description': 'Knife',
        'position': {'x': 220, 'y': 0, 'z': 180},
        'measurements': {
            'direction': 'NE',
            'timestamp': '2026-08-18T18:12:00',
        }
    },
    {
        'label': 'E-03',
        'type': 'Footwear Impression',
        'description': 'Simulated footprint E-03',
        'position': {'x': 340, 'y': 0, 'z': 260},
        'measurements': {
            'direction': 'NE',
            'timestamp': '2026-08-18T18:14:00',
            'length': '267 mm',
            'width': '97 mm',
        }
    },
    {
        'label': 'E-04',
        'type': 'Trace',
        'description': 'Trace evidence E-04',
        'position': {'x': 460, 'y': 0, 'z': 340},
        'measurements': {
            'timestamp': '2026-08-18T18:17:00'
        }
    }
]

SCENARIOS = [
    {
        'name': 'Scenario A',
        'description': 'Direct movement E-01 → E-02 → E-03 → E-04',
        'movementType': 'User created',
        'pathPoints': [
            {'x': 100, 'y': 0, 'z': 100},
            {'x': 220, 'y': 0, 'z': 180},
            {'x': 340, 'y': 0, 'z': 260},
            {'x': 460, 'y': 0, 'z': 340},
        ],
    },
    {
        'name': 'Scenario B',
        'description': 'Reverse movement E-04 → E-03 → E-02 → E-01',
        'movementType': 'User created',
        'pathPoints': [
            {'x': 460, 'y': 0, 'z': 340},
            {'x': 340, 'y': 0, 'z': 260},
            {'x': 220, 'y': 0, 'z': 180},
            {'x': 100, 'y': 0, 'z': 100},
        ],
    },
    {
        'name': 'Scenario C',
        'description': 'Incomplete path — insufficient path points',
        'movementType': 'User created',
        'pathPoints': [],
    }
]

MEASUREMENTS = {
    'lengths': [265, 267, 264, 266],
    'widths': [96, 97, 95, 96],
    'diameters': [22, 23, 21, 22],
}


def find_case():
    return DB.cases.find_one({'title': CASE_TITLE})


def seed():
    existing = find_case()
    if existing:
        print('RIVERSTONE SPATIAL TEST already exists — skipping seed')
        return

    case_doc = {
        'caseCode': 'RIVERSTONE-SPATIAL-01',
        'title': CASE_TITLE,
        'description': 'Controlled educational test case for validating evidence measurements, spatial plotting, scenarios, and timeline.',
        'location': 'Riverstone Test Area',
        'dimensions': {'width': 600, 'depth': 500},
        'createdAt': datetime.utcnow().isoformat(),
        'sceneState': {'evidenceIds': [], 'selectedEvidenceId': None, 'hasImage': False},
    }
    res = DB.cases.insert_one(case_doc)
    case_id = str(res.inserted_id)
    print('RIVERSTONE SPATIAL TEST created with id', case_id)

    created_evidence_ids = []
    for ev in EVIDENCE:
        doc = ev.copy()
        doc['caseId'] = case_id
        # ensure measurements exists
        if 'measurements' not in doc:
            doc['measurements'] = {}
        res = DB.evidence.insert_one(doc)
        eid = str(res.inserted_id)
        created_evidence_ids.append(eid)

    DB.cases.update_one({'_id': ObjectId(case_id)}, {'$set': {'sceneState.evidenceIds': created_evidence_ids}})
    print(f'{len(created_evidence_ids)} evidence records created')

    created_scenario_ids = []
    for sc in SCENARIOS:
        doc = sc.copy()
        doc['caseId'] = case_id
        doc['analysisStatus'] = 'Not analyzed'
        doc['analysisCounts'] = {'supporting': 0, 'conflicting': 0, 'unresolved': 0}
        doc['evidenceAnalysis'] = []
        doc['analysisTimeline'] = []
        doc['analysisConflicts'] = []
        doc['analysisGaps'] = []
        doc['analysisRecommendations'] = []
        res = DB.scenarios.insert_one(doc)
        created_scenario_ids.append(str(res.inserted_id))
    print(f'{len(created_scenario_ids)} scenarios created')

    # create simple calculations/measurements records for math engine
    for i, label in enumerate(['E-01', 'E-02', 'E-03', 'E-04']):
        length_val = MEASUREMENTS['lengths'][i]
        mdoc = {
            'caseId': case_id,
            'evidenceId': label,
            'title': f'Measurement {label} length',
            'category': 'measurement',
            'formula': 'recorded length',
            'inputs': f'label: {label}',
            'calculation': f'Length {length_val} mm',
            'result': f'{length_val}',
            'assumptions': 'Recorded measurement',
            'units': 'mm',
        }
        DB.calculations.insert_one(mdoc)
    print('Measurements created')
    print('Seeding complete')


if __name__ == '__main__':
    seed()
