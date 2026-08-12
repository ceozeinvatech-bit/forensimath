from pydantic import BaseModel, Field
from typing import Optional, Dict, Any

class Dimensions(BaseModel):
    width: float
    depth: float

class SceneState(BaseModel):
    evidenceIds: list = []
    selectedEvidenceId: Optional[str] = None
    hasImage: bool = False

class CaseCreate(BaseModel):
    title: str
    description: Optional[str] = ''
    location: Optional[str] = ''
    dimensions: Optional[Dimensions] = Field(default_factory=lambda: Dimensions(width=12.0, depth=8.0))

class CaseUpdate(BaseModel):
    title: Optional[str]
    description: Optional[str]
    location: Optional[str]
    dimensions: Optional[Dimensions]
