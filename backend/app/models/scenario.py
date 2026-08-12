from pydantic import BaseModel
from typing import Optional, List

class PathPoint(BaseModel):
    x: float
    y: float = 0.0
    z: float
    time: Optional[str] = None

class ScenarioCreate(BaseModel):
    name: str
    description: Optional[str] = ''
    movementType: Optional[str] = ''
    pathPoints: Optional[List[PathPoint]] = []
    # legacy compatibility field; not used in evidence analysis UI
    consistencyIndex: Optional[int] = 0

class ScenarioUpdate(BaseModel):
    name: Optional[str]
    description: Optional[str]
    movementType: Optional[str]
    pathPoints: Optional[List[PathPoint]]
    consistencyIndex: Optional[int]
