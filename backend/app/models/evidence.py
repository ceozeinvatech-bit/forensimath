from pydantic import BaseModel
from typing import Optional, Dict, Any

class Position(BaseModel):
    x: float
    y: float = 0.0
    z: float

class Measurements(BaseModel):
    length: Optional[str] = None
    width: Optional[str] = None
    majorAxis: Optional[str] = None
    minorAxis: Optional[str] = None
    notes: Optional[str] = None
    orientation: Optional[str] = None
    angle: Optional[str] = None
    radius: Optional[str] = None
    direction: Optional[str] = None

class EvidenceCreate(BaseModel):
    label: str
    type: str
    description: Optional[str] = ''
    position: Position
    measurements: Optional[Measurements] = Measurements()

class EvidenceUpdate(BaseModel):
    label: Optional[str]
    type: Optional[str]
    description: Optional[str]
    position: Optional[Position]
    measurements: Optional[Measurements]
