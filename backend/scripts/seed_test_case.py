"""
Idempotent seed script for RIVERSTONE DEMO test case.
Creates case, evidence, measurements, and three deterministic scenarios.
"""
from datetime import datetime
from bson import ObjectId
import os
import sys

sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
from app.database import get_db

DB = get_db()

CASE_TITLE = 'RIVERSTONE DEMO'

EVIDENCE = [
    {
        'label': 'E-01',
        'type': 'Footwear Impression',
        'description': 'Simulated footprint E-01',
        'position': {'x': 120, 'y': 0, 'z': 180},
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
        'position': {'x': 260, 'y': 0, 'z': 250},
        'measurements': {
            'direction': 'NE',
            'timestamp': '2026-08-18T18:12:00',
        }
    },
    {
        'label': 'E-03',
        'type': 'Footwear Impression',
        'description': 'Simulated footprint E-03',
        'position': {'x': 390, 'y': 0, 'z': 330},
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
        'position': {'x': 520, 'y': 0, 'z': 400},
        'measurements': {
            'timestamp': '2026-08-18T18:17:00'
        }
    }
]

SCENARIOS = [
    # Scenario A: path following E-01 -> E-02 -> E-03 -> E-04 (should be SUPPORTED)
    {
        'name': 'Scenario A',
        'description': 'Direct movement E-01 → E-02 → E-03 → E-04',
        'movementType': 'User created',
        'pathPoints': [
            {'x': 120, 'y': 0, 'z': 180},
            {'x': 260, 'y': 0, 'z': 250},
            {'x': 390, 'y': 0, 'z': 330},
            {'x': 520, 'y': 0, 'z': 400},
        ],
    },
    # Scenario B: reverse movement (should be CONFLICTING)
    {
        'name': 'Scenario B',
        'description': 'Reverse movement E-04 → E-03 → E-02 → E-01',
        'movementType': 'User created',
        'pathPoints': [
            {'x': 520, 'y': 0, 'z': 400},
            {'x': 390, 'y': 0, 'z': 330},
            {'x': 260, 'y': 0, 'z': 250},
            {'x': 120, 'y': 0, 'z': 180},
        ],
    },
    # Scenario C: missing path (cannot determine yet)
    {
        'name': 'Scenario C',
        'description': 'Incomplete path — insufficient path points',
        'movementType': 'User created',
        'pathPoints': [],
    }
]


def find_case():
    return DB.cases.find_one({'title': CASE_TITLE})


def seed():
    existing = find_case()
    if existing:
        print('RIVERSTONE DEMO already exists — skipping seed')
        return

    case_doc = {
        'caseCode': 'RIVERSTONE-01',
        'title': CASE_TITLE,
        'description': 'Deterministic demo case for testing scenario engine.',
        'location': 'Riverstone Warehouse',
        'dimensions': {'width': 600, 'depth': 500},
        'createdAt': datetime.utcnow().isoformat(),
        'sceneState': {'evidenceIds': [], 'selectedEvidenceId': None, 'hasImage': False},
    }
    res = DB.cases.insert_one(case_doc)
    case_id = str(res.inserted_id)
    print('RIVERSTONE DEMO created with id', case_id)

    created_evidence_ids = []
    for ev in EVIDENCE:
        doc = ev.copy()
        doc['caseId'] = case_id
        res = DB.evidence.insert_one(doc)
        eid = str(res.inserted_id)
        created_evidence_ids.append(eid)
        # keep evidence id list in case document
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
    measurements = []
    # length measurements from E-01 and E-03 and simulated others
    lengths = [265, 267, 264, 266]
    widths = [96, 97, 95, 96]
    diameters = [22, 23, 21, 22]
    for i, label in enumerate(['E-01', 'E-02', 'E-03', 'E-04']):
        mdoc = {
            'caseId': case_id,
            'evidenceId': label,
            'title': f'Measurement {label} length',
            'category': 'measurement',
            'formula': 'recorded length',
            'inputs': f'label: {label}',
            'calculation': f'Length {lengths[i]} mm',
            'result': f'{lengths[i]}',
            'assumptions': 'Recorded measurement',
            'units': 'mm',
        }
        DB.calculations.insert_one(mdoc)
    print('Measurements created')
    print('Seeding complete')


if __name__ == '__main__':
    seed()
