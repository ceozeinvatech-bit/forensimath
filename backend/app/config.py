from typing import TypedDict


class AnalysisConfig(TypedDict):
    distanceToleranceMeters: float
    timeToleranceSeconds: int
    positionToleranceMeters: float
    directionOppositeThresholdDegrees: float


DEFAULT_ANALYSIS_CONFIG: AnalysisConfig = {
    'distanceToleranceMeters': 5.0,
    'timeToleranceSeconds': 120,
    'positionToleranceMeters': 5.0,
    'directionOppositeThresholdDegrees': 150.0,
}
