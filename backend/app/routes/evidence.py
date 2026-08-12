from fastapi import APIRouter, HTTPException
from ..database import get_db
from bson import ObjectId

router = APIRouter()


def serialize_evidence(doc):
    e = {k: v for k, v in doc.items() if k != '_id'}
    e['id'] = str(doc['_id'])
    return e


@router.get('/cases/{case_id}/evidence', tags=['evidence'])
def list_evidence(case_id: str):
    db = get_db()
    docs = list(db.evidence.find({'caseId': case_id}))
    return [serialize_evidence(d) for d in docs]


@router.post('/cases/{case_id}/evidence', tags=['evidence'])
def create_evidence(case_id: str, payload: dict):
    db = get_db()
    doc = payload.copy()
    doc['caseId'] = case_id
    result = db.evidence.insert_one(doc)
    created = db.evidence.find_one({'_id': result.inserted_id})
    return serialize_evidence(created)


@router.get('/cases/{case_id}/evidence/{evidence_id}', tags=['evidence'])
def get_evidence(case_id: str, evidence_id: str):
    db = get_db()
    doc = db.evidence.find_one({'_id': ObjectId(evidence_id), 'caseId': case_id})
    if not doc:
        # try string id
        doc = db.evidence.find_one({'_id': ObjectId(evidence_id)})
    if not doc:
        raise HTTPException(status_code=404, detail='Evidence not found')
    return serialize_evidence(doc)


@router.patch('/cases/{case_id}/evidence/{evidence_id}', tags=['evidence'])
def update_evidence(case_id: str, evidence_id: str, payload: dict):
    db = get_db()
    result = db.evidence.update_one({'_id': ObjectId(evidence_id), 'caseId': case_id}, {'$set': payload})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail='Evidence not found')
    doc = db.evidence.find_one({'_id': ObjectId(evidence_id)})
    return serialize_evidence(doc)


@router.delete('/cases/{case_id}/evidence/{evidence_id}', tags=['evidence'])
def delete_evidence(case_id: str, evidence_id: str):
    db = get_db()
    result = db.evidence.delete_one({'_id': ObjectId(evidence_id), 'caseId': case_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail='Evidence not found')
    # also remove calculations related to this evidence
    db.calculations.delete_many({'caseId': case_id, 'evidenceId': evidence_id})
    return {'deleted': True}
