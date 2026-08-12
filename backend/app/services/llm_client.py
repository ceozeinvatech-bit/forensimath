import os
import json
import re
import urllib.request
from dotenv import load_dotenv

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '..', '..', '.env'))

LLM_API_KEY = os.getenv('LLM_API_KEY')
LLM_API_URL = os.getenv('LLM_API_URL')
LLM_PROVIDER = os.getenv('LLM_PROVIDER', 'google').lower()


class LLMClientError(Exception):
    pass


def _extract_text(result: dict) -> str:
    if LLM_PROVIDER == 'google':
        if isinstance(result.get('predictions'), list) and result['predictions']:
            prediction = result['predictions'][0]
            if isinstance(prediction, dict):
                return prediction.get('content') or prediction.get('output') or json.dumps(prediction)
        if 'outputs' in result and isinstance(result['outputs'], list) and result['outputs']:
            output = result['outputs'][0]
            if isinstance(output, dict):
                if 'content' in output:
                    if isinstance(output['content'], list):
                        return output['content'][0].get('text', '')
                    return output['content']
                return json.dumps(output)
    if LLM_PROVIDER == 'openai':
        choices = result.get('choices')
        if isinstance(choices, list) and choices:
            message = choices[0].get('message', {})
            return message.get('content', '')
    if 'text' in result:
        return result['text']
    if 'output' in result:
        output = result['output']
        if isinstance(output, list) and output:
            if isinstance(output[0], dict):
                return output[0].get('content', '') or json.dumps(output[0])
            return str(output[0])
    return json.dumps(result)


def _call_llm(prompt: str) -> str:
    if not LLM_API_KEY or not LLM_API_URL:
        raise LLMClientError('LLM_API_URL and LLM_API_KEY must be set in backend/.env')

    headers = {
        'Content-Type': 'application/json',
    }

    # For Google GenAI, prefer API key as query param unless using OAuth Bearer
    url = LLM_API_URL
    if LLM_PROVIDER == 'google' and LLM_API_KEY:
        if 'key=' not in url:
            sep = '&' if '?' in url else '?'
            url = f"{url}{sep}key={LLM_API_KEY}"
    else:
        # for other providers, include Authorization header
        headers['Authorization'] = f'Bearer {LLM_API_KEY}'

    if LLM_PROVIDER == 'google':
        # Google Generative API often accepts an "instances" array with content
        body = json.dumps({'instances': [{'content': prompt}]})
    elif LLM_PROVIDER == 'openai':
        body = json.dumps({'model': 'gpt-4o-mini', 'messages': [{'role': 'user', 'content': prompt}]})
    else:
        body = json.dumps({'input': prompt})

    request = urllib.request.Request(url, data=body.encode('utf-8'), headers=headers, method='POST')
    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            payload = response.read().decode('utf-8')
            result = json.loads(payload)
            return _extract_text(result)
    except urllib.error.HTTPError as e:
        details = e.read().decode('utf-8') if hasattr(e, 'read') else str(e)
        raise LLMClientError(f'LLM request failed: {e.code} {e.reason} - {details}')
    except Exception as e:
        raise LLMClientError(f'LLM request error: {e}')


def _safe_parse_json(value: str):
    if not value:
        return None
    try:
        return json.loads(value)
    except json.JSONDecodeError:
        wrapped = re.search(r'\{.*\}|\[.*\]', value, re.S)
        if wrapped:
            try:
                return json.loads(wrapped.group(0))
            except json.JSONDecodeError:
                return None
    return None


def generate_summary(case: dict, evidence: list, calculations: list, scenarios: list) -> str:
    prompt = (
        f"Generate an educational investigative summary for the case titled '{case.get('title')}' in a concise report style. "
        f"Include the scene location, evidence labels, key measurements, and the mathematical connections between evidence items. "
        f"Do not expose internal IDs; always refer to evidence by label.\n\n"
        f"Case description: {case.get('description', 'No description')}.\n"
        f"Evidence items:\n"
    )
    for item in evidence:
        prompt += f"- {item.get('label')} ({item.get('type')}), position ({item.get('position', {}).get('x', 'N/A')}, {item.get('position', {}).get('z', 'N/A')}), measurements {item.get('measurements', {})}\n"
    prompt += "\nMathematical results:\n"
    for calc in calculations:
        prompt += f"- {calc.get('title')}: {calc.get('result')} (inputs: {calc.get('inputs')})\n"
    if scenarios:
        prompt += "\nScenario comparisons:\n"
        for scenario in scenarios:
            prompt += f"- {scenario.get('name')}: {scenario.get('description')} ({scenario.get('consistencyIndex')}%)\n"
    prompt += (
        "\nWrite a report summary suitable for training or teaching forensic analysis. "
        "Use evidence labels like E01, E02, etc., and keep the tone technical and educational."
    )
    text = _call_llm(prompt)
    if not text:
        return 'LLM summary could not be generated; please check your API configuration.'
    return text


def generate_scenarios(case: dict, evidence: list) -> list:
    prompt = (
        f"Create up to three educational reconstruction scenarios for a forensic case titled '{case.get('title')}'. "
        f"Each scenario should be a short hypothesis using the evidence labels only, such as 'E01' or 'E03'. "
        f"Return a JSON array with fields name, description, movementType, pathPoints (array of {{x,y,z}} coordinates), and consistencyIndex (integer 0-100). "
        f"Use the following evidence labels and positions:\n"
    )
    for item in evidence:
        prompt += f"- {item.get('label')}: position ({item.get('position', {}).get('x', 'N/A')}, {item.get('position', {}).get('z', 'N/A')})\n"
    prompt += (
        "\nGenerate realistic path points that could connect the evidence in the scene. "
        "If you cannot generate valid JSON, return at least one scenario with an empty pathPoints array."
    )

    text = _call_llm(prompt)
    parsed = _safe_parse_json(text)
    if isinstance(parsed, list):
        return [item for item in parsed if isinstance(item, dict)]

    # fallback simple scenario generation
    fallback = []
    for index in range(min(2, len(evidence))):
        item = evidence[index]
        fallback.append({
            'name': f'Scenario {chr(65 + index)}',
            'description': f'Path focused on {item.get("label")} and nearby evidence.',
            'movementType': 'Predicted path',
            'pathPoints': [{'x': item.get('position', {}).get('x', 0), 'y': item.get('position', {}).get('y', 0), 'z': item.get('position', {}).get('z', 0)}],
            'consistencyIndex': 60 + index * 10,
        })
    return fallback


def generate_scenario_explanation(case: dict, scenario: dict, evidence: list, evaluation: dict = None) -> str:
    """
    Generate a human-readable explanation for a single scenario using the LLM.
    The explanation should reference evidence labels (E01, E02...), the scenario name,
    and the numeric `consistencyIndex`/evaluation details (if available). Do not expose DB ids.
    """
    if not scenario:
        return 'No scenario provided.'

    title = scenario.get('name') or scenario.get('title') or 'Unnamed scenario'
    desc = scenario.get('description', '')
    ci = scenario.get('consistencyIndex') or (evaluation or {}).get('consistencyIndex')

    prompt = (
        f"Write a clear, educational explanation for the scenario titled '{title}'.\n"
        f"Scenario description: {desc}\n"
        f"Consistency index: {ci if ci is not None else 'N/A'} (0-100).\n\n"
        "Evidence provided:\n"
    )
    for item in evidence:
        prompt += f"- {item.get('label')}: position ({item.get('position', {}).get('x', 'N/A')}, {item.get('position', {}).get('y', 'N/A')}, {item.get('position', {}).get('z', 'N/A')})\n"

    prompt += "\nProvide a concise explanation (3-6 sentences) describing why the scenario scores as it does, what evidence supports or contradicts it, and one suggested next analysis step. Use only evidence labels (E01, E02...) and avoid technical DB identifiers."

    text = _call_llm(prompt)
    if not text:
        return 'LLM explanation could not be generated; check configuration.'
    return text


def generate_scenario_insights(payload: dict) -> dict:
    """
    Send structured scenario data to the LLM and request a JSON object with
    keys: overview, strengths, weaknesses, important_evidence, mathematical_observations,
    plain_language_explanation, limitations.

    The LLM must not return new numerical scores; it should only comment on provided numbers.
    """
    prompt = (
        "You are an expert forensic-educational assistant.\n"
        "Given the following structured input (case, scenario, dimension scores, evidence deviations, and math details), "
        "produce a JSON object with keys: overview, strengths (list), weaknesses (list), important_evidence (list), "
        "mathematical_observations (list), plain_language_explanation (string), limitations (list).\n"
        "Do NOT change or invent numeric scores. Use the provided numbers only.\n\n"
        + json.dumps(payload)
        + "\n\nRespond ONLY with the JSON object."
    )

    text = _call_llm(prompt)
    parsed = _safe_parse_json(text)
    if isinstance(parsed, dict):
        # ensure expected keys
        keys = ['overview', 'strengths', 'weaknesses', 'important_evidence', 'mathematical_observations', 'plain_language_explanation', 'limitations']
        result = {k: parsed.get(k) for k in keys}
        return result
    # fallback: return a minimal structured explanation
    return {
        'overview': 'LLM did not return structured JSON.',
        'strengths': [],
        'weaknesses': [],
        'important_evidence': [],
        'mathematical_observations': [],
        'plain_language_explanation': text or 'No explanation available.',
        'limitations': [],
    }
