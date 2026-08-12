from fastapi import APIRouter, HTTPException
from ..database import get_db
from ..services.math_engine import build_calculations
from ..services.llm_client import generate_summary as generate_llm_summary
from bson import ObjectId

router = APIRouter()


@router.get('/cases/{case_id}/calculations', tags=['analysis'])
def list_calculations(case_id: str):
    db = get_db()
    docs = list(db.calculations.find({'caseId': case_id}))
    for d in docs:
        d['id'] = str(d.get('_id'))
        d.pop('_id', None)
    return docs


@router.post('/cases/{case_id}/analysis/run', tags=['analysis'])
def run_analysis(case_id: str):
    db = get_db()
    # collect evidence
    evidence = list(db.evidence.find({'caseId': case_id}))
    for e in evidence:
        e['id'] = str(e.get('_id'))
        e.pop('_id', None)
    calculations = build_calculations(evidence)
    # store calculations replacing existing ones for this case
    db.calculations.delete_many({'caseId': case_id})
    for calc in calculations:
        cdoc = calc.copy()
        cdoc['caseId'] = case_id
        db.calculations.insert_one(cdoc)
    # return stored calculations
    stored = list(db.calculations.find({'caseId': case_id}))
    for s in stored:
        s['id'] = str(s.get('_id'))
        s.pop('_id', None)
    return stored


@router.get('/cases/{case_id}/analysis', tags=['analysis'])
def get_analysis_state(case_id: str):
    # lightweight placeholder: return whether calculations exist
    db = get_db()
    count = db.calculations.count_documents({'caseId': case_id})
    return {'hasCalculations': count > 0, 'count': count}


@router.post('/cases/{case_id}/reconstruction', tags=['analysis'])
def generate_reconstruction(case_id: str):
    db = get_db()
    db.cases.update_one({'_id': ObjectId(case_id)}, {'$set': {'reconstructionGenerated': True}})
    return {'generated': True}


@router.post('/cases/{case_id}/summary', tags=['analysis'])
def generate_summary(case_id: str):
    db = get_db()
    case_doc = db.cases.find_one({'_id': ObjectId(case_id)})
    if not case_doc:
        raise HTTPException(status_code=404, detail='Case not found')
    case_doc['id'] = str(case_doc['_id'])
    case_doc.pop('_id', None)

    evidence = list(db.evidence.find({'caseId': case_id}))
    for e in evidence:
        e['id'] = str(e.get('_id'))
        e.pop('_id', None)

    calculations = list(db.calculations.find({'caseId': case_id}))
    for c in calculations:
        c['id'] = str(c.get('_id'))
        c.pop('_id', None)

    scenarios = list(db.scenarios.find({'caseId': case_id}))
    for s in scenarios:
        s['id'] = str(s.get('_id'))
        s.pop('_id', None)

    summary_text = generate_llm_summary(case_doc, evidence, calculations, scenarios)
    db.cases.update_one({'_id': ObjectId(case_id)}, {'$set': {'summaryGenerated': True, 'summaryText': summary_text}})
    return {'summary': summary_text, 'generated': True}
