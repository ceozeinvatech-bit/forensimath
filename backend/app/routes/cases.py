from fastapi import APIRouter, HTTPException
from ..database import get_db
from ..services.math_engine import build_calculations
from bson import ObjectId
from datetime import datetime

router = APIRouter()

def serialize_case(doc, db):
    case = {k: v for k, v in doc.items() if k != '_id'}
    case['id'] = str(doc['_id'])
    # attach related arrays
    evidence = list(db.evidence.find({'caseId': case['id']}))
    for e in evidence:
        e['id'] = str(e.get('_id'))
        e.pop('_id', None)
    scenarios = list(db.scenarios.find({'caseId': case['id']}))
    for s in scenarios:
        s['id'] = str(s.get('_id'))
        s.pop('_id', None)
    calculations = list(db.calculations.find({'caseId': case['id']}))
    for c in calculations:
        c['id'] = str(c.get('_id'))
        c.pop('_id', None)

    case['evidence'] = evidence
    case['scenarios'] = scenarios
    case['calculations'] = calculations
    return case


@router.get('', tags=['cases'])
def list_cases():
    db = get_db()
    docs = list(db.cases.find())
    return [serialize_case(doc, db) for doc in docs]


@router.post('', tags=['cases'])
def create_case(payload: dict):
    db = get_db()
    doc = {
        'caseCode': payload.get('caseCode'),
        'title': payload.get('title'),
        'description': payload.get('description'),
        'location': payload.get('location'),
        'dimensions': payload.get('dimensions', {'width': 12, 'depth': 8}),
        'createdAt': payload.get('createdAt', datetime.utcnow().isoformat()),
        'sceneState': payload.get('sceneState', {'evidenceIds': [], 'selectedEvidenceId': None, 'hasImage': False}),
    }
    result = db.cases.insert_one(doc)
    created = db.cases.find_one({'_id': result.inserted_id})
    return serialize_case(created, db)


@router.get('/{case_id}', tags=['cases'])
def get_case(case_id: str):
    db = get_db()
    doc = db.cases.find_one({'_id': ObjectId(case_id)})
    if not doc:
        # fall back to string id lookup
        doc = db.cases.find_one({'_id': ObjectId(case_id)})
    if not doc:
        raise HTTPException(status_code=404, detail='Case not found')
    return serialize_case(doc, db)


@router.patch('/{case_id}', tags=['cases'])
def update_case(case_id: str, payload: dict):
    db = get_db()
    result = db.cases.update_one({'_id': ObjectId(case_id)}, {'$set': payload})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail='Case not found')
    doc = db.cases.find_one({'_id': ObjectId(case_id)})
    return serialize_case(doc, db)


@router.delete('/{case_id}', tags=['cases'])
def delete_case(case_id: str):
    db = get_db()
    # delete case
    result = db.cases.delete_one({'_id': ObjectId(case_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail='Case not found')
    # cascade delete related docs by referencing caseId string
    db.evidence.delete_many({'caseId': case_id})
    db.scenarios.delete_many({'caseId': case_id})
    db.calculations.delete_many({'caseId': case_id})
    return {'deleted': True}
