from pydantic import BaseModel
from typing import List, Optional, Any


class ScenarioInsights(BaseModel):
    overview: str
    strengths: List[str]
    weaknesses: List[str]
    important_evidence: List[str]
    mathematical_observations: List[str]
    plain_language_explanation: str
    limitations: List[str]
