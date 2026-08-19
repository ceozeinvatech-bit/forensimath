from fastapi import APIRouter, HTTPException
import os
from ..database import get_db
from ..services.evidence_analysis import analyze_scenario
from ..schemas import ScenarioInsights
from bson import ObjectId

# enable/disable LLM usage via env var USE_LLM (0/false to disable)
USE_LLM = os.getenv('USE_LLM', '1') not in ('0', 'false', 'False', 'no', 'No')

if USE_LLM:
    from ..services.llm_client import generate_scenarios
else:
    # deterministic replacements when LLM is disabled
    def generate_scenarios(case_doc, evidence):
        count = max(1, min(3, len(evidence) or 1))
        base_names = ['Scenario A', 'Scenario B', 'Scenario C']
        out = []
        for i in range(count):
            out.append({
                'name': base_names[i],
                'description': f'Deterministic auto-generated {base_names[i]}',
                'movementType': 'walk',
                'pathPoints': [],
            })
        return out


def _build_insights(analysis_result: dict) -> dict:
    counts = analysis_result.get('analysisCounts', {})
    important = [record.get('evidenceId') for record in analysis_result.get('evidenceAnalysis', [])][:4]
    explanation_lines = [
        f"This scenario is {analysis_result.get('analysisStatus', 'pending').lower()}.",
        f"Supporting: {counts.get('supporting', 0)}, conflicting: {counts.get('conflicting', 0)}, unresolved: {counts.get('unresolved', 0)}.",
    ]
    if analysis_result.get('analysisRecommendations'):
        explanation_lines.append(f"Recommendation: {analysis_result['analysisRecommendations'][0]}")
    return {
        'overview': 'Deterministic evidence reconstruction analysis generated from scenario and evidence data.',
        'strengths': [f"{counts.get('supporting', 0)} supporting observations"],
        'weaknesses': [f"{counts.get('conflicting', 0)} conflicting observations" if counts.get('conflicting', 0) else 'No direct conflicts detected'],
        'important_evidence': [item for item in important if item],
        'mathematical_observations': [
            f"{len(analysis_result.get('analysisTimeline', []))} timestamped evidence items considered.",
            f"{len(analysis_result.get('evidenceAnalysis', []))} total evidence records analyzed.",
        ],
        'plain_language_explanation': ' '.join(explanation_lines),
        'limitations': ['This summary is deterministic and rule-based, without LLM reasoning.'],
    }


router = APIRouter()

def serialize_scenario(doc):
    s = {k: v for k, v in doc.items() if k != '_id'}
    s['id'] = str(doc['_id'])
    return s


@router.get('/cases/{case_id}/scenarios', tags=['scenarios'])
def list_scenarios(case_id: str):
    db = get_db()
    docs = list(db.scenarios.find({'caseId': case_id}))
    return [serialize_scenario(d) for d in docs]


@router.post('/cases/{case_id}/scenarios/autogen', tags=['scenarios'])
def auto_generate_scenarios(case_id: str):
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

    generated = generate_scenarios(case_doc, evidence)
    created = []
    for scenario in generated:
        doc = scenario.copy()
        doc['caseId'] = case_id
        doc['analysisStatus'] = 'Not analyzed'
        doc['analysisCounts'] = {'supporting': 0, 'conflicting': 0, 'unresolved': 0}
        doc['evidenceAnalysis'] = []
        doc['analysisTimeline'] = []
        doc['analysisConflicts'] = []
        doc['analysisGaps'] = []
        doc['analysisRecommendations'] = []
        result = db.scenarios.insert_one(doc)
        stored = db.scenarios.find_one({'_id': result.inserted_id})
        created.append(serialize_scenario(stored))
    return created


@router.post('/cases/{case_id}/scenarios', tags=['scenarios'])
def create_scenario(case_id: str, payload: dict):
    db = get_db()
    doc = payload.copy()
    doc['caseId'] = case_id
    doc['analysisStatus'] = 'Not analyzed'
    doc['analysisCounts'] = {'supporting': 0, 'conflicting': 0, 'unresolved': 0}
    doc['evidenceAnalysis'] = []
    doc['analysisTimeline'] = []
    doc['analysisConflicts'] = []
    doc['analysisGaps'] = []
    doc['analysisRecommendations'] = []
    result = db.scenarios.insert_one(doc)
    created = db.scenarios.find_one({'_id': result.inserted_id})
    return serialize_scenario(created)


@router.get('/cases/{case_id}/scenarios/{scenario_id}', tags=['scenarios'])
def get_scenario(case_id: str, scenario_id: str):
    db = get_db()
    doc = db.scenarios.find_one({'_id': ObjectId(scenario_id), 'caseId': case_id})
    if not doc:
        raise HTTPException(status_code=404, detail='Scenario not found')
    return serialize_scenario(doc)


@router.patch('/cases/{case_id}/scenarios/{scenario_id}', tags=['scenarios'])
def update_scenario(case_id: str, scenario_id: str, payload: dict):
    db = get_db()
    scenario = db.scenarios.find_one({'_id': ObjectId(scenario_id), 'caseId': case_id})
    if not scenario:
        raise HTTPException(status_code=404, detail='Scenario not found')
    allowed = {'name', 'description', 'movementType', 'pathPoints'}
    changes = {key: value for key, value in payload.items() if key in allowed}
    if changes:
        db.scenarios.update_one({'_id': ObjectId(scenario_id), 'caseId': case_id}, {'$set': changes})
    updated = db.scenarios.find_one({'_id': ObjectId(scenario_id), 'caseId': case_id})
    return serialize_scenario(updated)


@router.post('/cases/{case_id}/scenarios/{scenario_id}/insights', tags=['scenarios'])
def generate_scenario_insights_route(case_id: str, scenario_id: str):
    db = get_db()
    scenario = db.scenarios.find_one({'_id': ObjectId(scenario_id), 'caseId': case_id})
    if not scenario:
        raise HTTPException(status_code=404, detail='Scenario not found')

    case_doc = db.cases.find_one({'_id': ObjectId(case_id)})
    if case_doc:
        case_doc['id'] = str(case_doc['_id'])
        case_doc.pop('_id', None)

    evidence = list(db.evidence.find({'caseId': case_id}))
    for e in evidence:
        e['id'] = str(e.get('_id'))
        e.pop('_id', None)

    analysis_result = analyze_scenario(scenario, evidence)
    insights_obj = _build_insights(analysis_result)
    ScenarioInsights(**insights_obj)

    db.scenarios.update_one(
        {'_id': ObjectId(scenario_id)},
        {'$set': {'insights': insights_obj, 'analysisStatus': analysis_result['analysisStatus'], 'analysisCounts': analysis_result['analysisCounts'], 'analysisTimeline': analysis_result['analysisTimeline'], 'analysisConflicts': analysis_result['analysisConflicts'], 'analysisGaps': analysis_result['analysisGaps'], 'analysisRecommendations': analysis_result['analysisRecommendations'], 'analysisLastUpdated': analysis_result['analysisLastUpdated']}}
    )
    updated = db.scenarios.find_one({'_id': ObjectId(scenario_id)})
    return serialize_scenario(updated)


@router.post('/cases/{case_id}/scenarios/{scenario_id}/explain', tags=['scenarios'])
def explain_scenario_route(case_id: str, scenario_id: str):
    db = get_db()
    scenario = db.scenarios.find_one({'_id': ObjectId(scenario_id), 'caseId': case_id})
    if not scenario:
        raise HTTPException(status_code=404, detail='Scenario not found')

    evidence = list(db.evidence.find({'caseId': case_id}))
    for e in evidence:
        e['id'] = str(e.get('_id'))
        e.pop('_id', None)

    analysis_result = analyze_scenario(scenario, evidence)
    explanation_lines = [
        f"This scenario is {analysis_result['analysisStatus']}.",
        f"Supporting evidence items: {analysis_result['analysisCounts'].get('supporting', 0)}.",
        f"Conflicting evidence items: {analysis_result['analysisCounts'].get('conflicting', 0)}.",
    ]
    if analysis_result['analysisConflicts']:
        first_conflict = analysis_result['analysisConflicts'][0]
        explanation_lines.append(
            f"The first conflict is {first_conflict['type']} for evidence {first_conflict['evidenceId']} ({first_conflict['difference']})."
        )
    if analysis_result['analysisGaps']:
        explanation_lines.append('There are also gap observations that may require additional evidence.')
    explanation = ' '.join(explanation_lines)

    db.scenarios.update_one(
        {'_id': ObjectId(scenario_id)},
        {'$set': {
            'explanation': explanation,
            'analysisStatus': analysis_result['analysisStatus'],
            'analysisCounts': analysis_result['analysisCounts'],
            'evidenceAnalysis': analysis_result['evidenceAnalysis'],
            'analysisTimeline': analysis_result['analysisTimeline'],
            'analysisConflicts': analysis_result['analysisConflicts'],
            'analysisGaps': analysis_result['analysisGaps'],
            'analysisRecommendations': analysis_result['analysisRecommendations'],
            'analysisLastUpdated': analysis_result['analysisLastUpdated'],
        }}
    )
    updated = db.scenarios.find_one({'_id': ObjectId(scenario_id)})
    return serialize_scenario(updated)


@router.post('/cases/{case_id}/scenarios/{scenario_id}/evaluate', tags=['scenarios'])
def evaluate_scenario_route(case_id: str, scenario_id: str):
    db = get_db()
    scenario = db.scenarios.find_one({'_id': ObjectId(scenario_id), 'caseId': case_id})
    if not scenario:
        raise HTTPException(status_code=404, detail='Scenario not found')

    evidence = list(db.evidence.find({'caseId': case_id}))
    for e in evidence:
        e['id'] = str(e.get('_id'))
        e.pop('_id', None)

    # perform deterministic analysis
    analysis_result = analyze_scenario(scenario, evidence)

    update = {
        'analysisStatus': analysis_result['analysisStatus'],
        'analysisCounts': analysis_result['analysisCounts'],
        'evidenceAnalysis': analysis_result['evidenceAnalysis'],
        'analysisTimeline': analysis_result['analysisTimeline'],
        'analysisConflicts': analysis_result['analysisConflicts'],
        'analysisGaps': analysis_result['analysisGaps'],
        'analysisRecommendations': analysis_result['analysisRecommendations'],
        'analysisLastUpdated': analysis_result['analysisLastUpdated'],
    }
    db.scenarios.update_one({'_id': ObjectId(scenario_id)}, {'$set': update})
    updated = db.scenarios.find_one({'_id': ObjectId(scenario_id)})
    return serialize_scenario(updated)


@router.post('/cases/{case_id}/scenarios/{scenario_id}/reset', tags=['scenarios'])
def reset_scenario_analysis_route(case_id: str, scenario_id: str):
    db = get_db()
    scenario = db.scenarios.find_one({'_id': ObjectId(scenario_id), 'caseId': case_id})
    if not scenario:
        raise HTTPException(status_code=404, detail='Scenario not found')

    reset = {
        'explanation': None,
        'insights': None,
        'analysisStatus': 'Not analyzed',
        'analysisCounts': {'supporting': 0, 'conflicting': 0, 'unresolved': 0},
        'evidenceAnalysis': [],
        'analysisTimeline': [],
        'analysisConflicts': [],
        'analysisGaps': [],
        'analysisRecommendations': [],
        'analysisLastUpdated': None,
    }
    db.scenarios.update_one({'_id': ObjectId(scenario_id)}, {'$set': reset})
    updated = db.scenarios.find_one({'_id': ObjectId(scenario_id)})
    return serialize_scenario(updated)


@router.post('/cases/{case_id}/scenarios/evaluateAll', tags=['scenarios'])
def evaluate_all_scenarios(case_id: str):
    db = get_db()
    scenarios = list(db.scenarios.find({'caseId': case_id}))
    if not scenarios:
        return []
    evidence = list(db.evidence.find({'caseId': case_id}))
    for e in evidence:
        e['id'] = str(e.get('_id'))
        e.pop('_id', None)

    results = []
    for sc in scenarios:
        analysis_result = analyze_scenario(sc, evidence)
        update = {
            'analysisStatus': analysis_result['analysisStatus'],
            'analysisCounts': analysis_result['analysisCounts'],
            'evidenceAnalysis': analysis_result['evidenceAnalysis'],
            'analysisTimeline': analysis_result['analysisTimeline'],
            'analysisConflicts': analysis_result['analysisConflicts'],
            'analysisGaps': analysis_result['analysisGaps'],
            'analysisRecommendations': analysis_result['analysisRecommendations'],
            'analysisLastUpdated': analysis_result['analysisLastUpdated'],
        }
        db.scenarios.update_one({'_id': sc['_id']}, {'$set': update})
        stored = db.scenarios.find_one({'_id': sc['_id']})
        results.append(serialize_scenario(stored))
    return results
