from typing import Any, Dict, List, Optional
import math
from datetime import datetime

from ..config import DEFAULT_ANALYSIS_CONFIG


Status = str
Severity = Optional[str]


def _parse_number(value: Any) -> Optional[float]:
    if value is None:
        return None
    if isinstance(value, (int, float)):
        return float(value)
    try:
        text = str(value)
        text = text.strip()
        if not text:
            return None
        # extract first numeric token
        import re
        match = re.search(r'-?\d+(?:\.\d+)?', text)
        if match:
            return float(match.group(0))
    except Exception:
        pass
    return None


def _format_position(pos: Dict[str, Any]) -> str:
    if not pos:
        return 'Unknown'
    x = _parse_number(pos.get('x'))
    y = _parse_number(pos.get('y'))
    z = _parse_number(pos.get('z'))
    if x is None or y is None or z is None:
        return 'Unknown'
    return f"({x:.1f}, {y:.1f}, {z:.1f})"


def _point_distance(a: Dict[str, Any], b: Dict[str, Any]) -> float:
    ax = _parse_number(a.get('x')) or 0.0
    ay = _parse_number(a.get('y')) or 0.0
    az = _parse_number(a.get('z')) or 0.0
    bx = _parse_number(b.get('x')) or 0.0
    by = _parse_number(b.get('y')) or 0.0
    bz = _parse_number(b.get('z')) or 0.0
    return math.sqrt((ax - bx) ** 2 + (ay - by) ** 2 + (az - bz) ** 2)


def _normalize_direction(direction: Optional[str]) -> Optional[str]:
    if not direction:
        return None
    val = str(direction).strip().upper()
    if not val:
        return None
    return val


def _direction_angle(label: str) -> Optional[float]:
    mapping = {
        'N': 0,
        'NORTH': 0,
        'NE': 45,
        'E': 90,
        'EAST': 90,
        'SE': 135,
        'S': 180,
        'SOUTH': 180,
        'SW': 225,
        'W': 270,
        'WEST': 270,
        'NW': 315,
    }
    return mapping.get(label)


def _time_to_seconds(value: Any) -> Optional[int]:
    if value is None:
        return None
    try:
        text = str(value).strip()
        if not text:
            return None
        # Try ISO format first (e.g., 2026-08-18T18:10:00)
        try:
            dt = datetime.fromisoformat(text)
            return dt.hour * 3600 + dt.minute * 60 + dt.second
        except Exception:
            pass

        # Fallback: try HH:MM or HH:MM:SS
        parts = text.split(':')
        if len(parts) == 2 and parts[0].isdigit() and parts[1].isdigit():
            h, m = int(parts[0]), int(parts[1])
            return h * 3600 + m * 60
        if len(parts) == 3 and parts[0].isdigit() and parts[1].isdigit() and parts[2].isdigit():
            h, m, s = int(parts[0]), int(parts[1]), int(parts[2])
            return h * 3600 + m * 60 + s
    except Exception:
        return None


def _angle_difference(a: float, b: float) -> float:
    diff = abs((a - b + 180) % 360 - 180)
    return diff


def _predicted_direction_from_path(path: List[Dict[str, Any]], evidence_position: Dict[str, Any]) -> Optional[str]:
    if not path:
        return None
    # find closest segment and return its cardinal direction label if available
    best_seg = None
    best_dist = float('inf')
    for i in range(len(path) - 1):
        a = path[i]
        b = path[i + 1]
        d = min(_point_distance(a, evidence_position), _point_distance(b, evidence_position))
        if d < best_dist:
            best_dist = d
            best_seg = (a, b)
    if not best_seg:
        return None
    a, b = best_seg
    dx = (_parse_number(b.get('x')) or 0.0) - (_parse_number(a.get('x')) or 0.0)
    dz = (_parse_number(b.get('z')) or 0.0) - (_parse_number(a.get('z')) or 0.0)
    angle = math.degrees(math.atan2(dz, dx))
    if angle < 0:
        angle += 360
    # map to 8-point compass
    if angle < 22.5 or angle >= 337.5:
        return 'N'
    if angle < 67.5:
        return 'NE'
    if angle < 112.5:
        return 'E'
    if angle < 157.5:
        return 'SE'
    if angle < 202.5:
        return 'S'
    if angle < 247.5:
        return 'SW'
    if angle < 292.5:
        return 'W'
    return 'NW'


def _format_time(seconds: Optional[int]) -> str:
    if seconds is None:
        return 'Unknown'
    h = seconds // 3600
    m = (seconds % 3600) // 60
    s = seconds % 60
    if s:
        return f"{h:02d}:{m:02d}:{s:02d}"
    return f"{h:02d}:{m:02d}"


def _compose_conflict_severity(difference: float, tolerance: float) -> str:
    if difference <= tolerance * 1.5:
        return 'LOW'
    if difference <= tolerance * 3:
        return 'MEDIUM'
    return 'HIGH'


def _missing_fields_for_evidence(evidence: Dict[str, Any]) -> List[str]:
    missing = []
    pos = evidence.get('position')
    if not pos or _parse_number(pos.get('x')) is None or _parse_number(pos.get('y')) is None or _parse_number(pos.get('z')) is None:
        missing.append('position')
    measurements = evidence.get('measurements', {}) or {}
    # direction can be represented as a textual label (e.g., 'NE') or numeric orientation/angle
    if not (measurements.get('direction') or measurements.get('orientation') or measurements.get('angle')):
        missing.append('direction')
    if _time_to_seconds(measurements.get('timestamp') or measurements.get('time')) is None:
        missing.append('timestamp')
    return missing


def _parse_evidence_values(evidence: Dict[str, Any]) -> Dict[str, Any]:
    measurements = evidence.get('measurements', {}) or {}
    observed = {}
    observed['position'] = evidence.get('position')
    # Only treat an explicit 'distance' measurement as a distance in metres.
    # Do not substitute footprint length/width (mm) for spatial distance.
    observed['distance'] = _parse_number(measurements.get('distance'))
    observed_dir = measurements.get('direction') or measurements.get('orientation') or measurements.get('angle')
    if observed_dir is not None:
        observed_dir = _normalize_direction(observed_dir)
    observed['direction'] = observed_dir
    observed['timestamp'] = _time_to_seconds(measurements.get('timestamp') or measurements.get('time'))
    observed['timestampRaw'] = str(measurements.get('timestamp') or measurements.get('time') or '')
    return observed


def analyze_scenario(scenario: Dict[str, Any], evidence_list: List[Dict[str, Any]], config: Dict[str, Any] = DEFAULT_ANALYSIS_CONFIG) -> Dict[str, Any]:
    path = scenario.get('pathPoints') or []
    if path and all(_parse_number(pt.get('x')) is not None and _parse_number(pt.get('z')) is not None for pt in path):
        path_points = path
    else:
        path_points = []

    analysis_records: List[Dict[str, Any]] = []
    supporting = conflicting = unresolved = 0
    gaps: List[str] = []
    conflicts: List[Dict[str, Any]] = []
    recommendations: List[str] = []
    timeline: List[Dict[str, Any]] = []

    for evidence in evidence_list:
        evidence_id = evidence.get('label') or evidence.get('id') or 'Unknown'
        evidenced_type = evidence.get('type') or 'Unknown'
        observed = _parse_evidence_values(evidence)
        predicted_position = None
        predicted_position_display = 'Unknown'
        predicted_distance = None
        predicted_direction = None
        predicted_time = None

        if path_points:
            # predicted position is nearest path point
            nearest = min(path_points, key=lambda p: _point_distance(p, observed.get('position') or {})) if observed.get('position') else None
            predicted_position = nearest if nearest else None
            predicted_position_display = _format_position(predicted_position) if predicted_position else 'Unknown'
            if observed.get('position'):
                predicted_distance = _point_distance(predicted_position or {}, observed['position'])
            predicted_direction = _predicted_direction_from_path(path_points, observed.get('position') or {})
        else:
            predicted_position_display = 'Unavailable'

        record_status = 'UNRESOLVED'
        record_severity = None
        field_explanations = []
        differences = []
        field_statuses: List[str] = []
        missing = _missing_fields_for_evidence(evidence)
        if missing:
            field_explanations.append(f"This evidence cannot be classified because the required {', '.join(missing)} information is unavailable.")

        # distance comparison
        if observed.get('distance') is None:
            field_status = 'UNRESOLVED'
        elif predicted_distance is None:
            field_status = 'UNRESOLVED'
        else:
            diff = abs(observed['distance'] - predicted_distance)
            tolerance = config['distanceToleranceMeters']
            if diff <= tolerance:
                field_status = 'SUPPORTING'
                field_explanations.append(
                    f"The observed distance of {observed['distance']} m is within the configured tolerance of the scenario's predicted distance of {predicted_distance:.1f} m."
                )
            else:
                field_status = 'CONFLICTING'
                field_severity = _compose_conflict_severity(diff, tolerance)
                field_explanations.append(
                    f"The observed distance of {observed['distance']} m differs from the scenario's predicted distance of {predicted_distance:.1f} m by {diff:.1f} m, exceeding the configured tolerance of {tolerance} m."
                )
                conflicts.append({
                    'evidenceId': evidence_id,
                    'type': 'Distance Conflict',
                    'observed': f"{observed['distance']} m",
                    'predicted': f"{predicted_distance:.1f} m",
                    'difference': f"{diff:.1f} m",
                    'severity': field_severity,
                    'explanation': field_explanations[-1],
                })
                record_severity = field_severity
            differences.append(f"distance: {diff:.1f} m")
        field_statuses.append(field_status)

        # position comparison
        if observed.get('position') is None:
            field_status = 'UNRESOLVED'
            if 'position' not in missing:
                missing.append('position')
        elif predicted_position is None:
            field_status = 'UNRESOLVED'
        else:
            dist_to_path = _point_distance(predicted_position, observed['position'])
            tolerance = config['positionToleranceMeters']
            if dist_to_path <= tolerance:
                field_status = 'SUPPORTING'
                field_explanations.append(
                    f"The observed position { _format_position(observed['position']) } is within {dist_to_path:.1f} m of the scenario's predicted position {predicted_position_display}."
                )
            else:
                field_status = 'CONFLICTING'
                field_severity = _compose_conflict_severity(dist_to_path, tolerance)
                field_explanations.append(
                    f"The observed position { _format_position(observed['position']) } differs from the predicted position {predicted_position_display} by {dist_to_path:.1f} m, exceeding the configured tolerance of {tolerance} m."
                )
                conflicts.append({
                    'evidenceId': evidence_id,
                    'type': 'Position Conflict',
                    'observed': _format_position(observed['position']),
                    'predicted': predicted_position_display,
                    'difference': f"{dist_to_path:.1f} m",
                    'severity': field_severity,
                    'explanation': field_explanations[-1],
                })
                record_severity = record_severity or field_severity
            differences.append(f"position: {dist_to_path:.1f} m")
        field_statuses.append(field_status)

        # direction comparison
        if observed.get('direction') is None:
            field_status = 'UNRESOLVED'
            if 'direction' not in missing:
                missing.append('direction')
        elif predicted_direction is None:
            field_status = 'UNRESOLVED'
        else:
            observed_dir = _normalize_direction(observed['direction'])
            predicted_dir = _normalize_direction(predicted_direction)
            if observed_dir == predicted_dir:
                field_status = 'SUPPORTING'
                field_explanations.append(
                    f"The observed direction ({observed_dir}) matches the direction predicted by the scenario."
                )
            else:
                obs_angle = _direction_angle(observed_dir)
                pred_angle = _direction_angle(predicted_dir)
                if obs_angle is not None and pred_angle is not None:
                    diff_angle = _angle_difference(obs_angle, pred_angle)
                    if diff_angle >= config['directionOppositeThresholdDegrees']:
                        field_status = 'CONFLICTING'
                        field_severity = 'MEDIUM'
                        field_explanations.append(
                            f"The observed direction ({observed_dir}) differs from the scenario's predicted direction ({predicted_dir})."
                        )
                        conflicts.append({
                            'evidenceId': evidence_id,
                            'type': 'Direction Conflict',
                            'observed': observed_dir,
                            'predicted': predicted_dir,
                            'difference': f"{diff_angle:.1f}°",
                            'severity': field_severity,
                            'explanation': field_explanations[-1],
                        })
                        record_severity = record_severity or field_severity
                    else:
                        field_status = 'UNRESOLVED'
                        field_explanations.append(
                            f"The observed direction ({observed_dir}) differs from the scenario's predicted direction ({predicted_dir})."
                        )
                else:
                    field_status = 'UNRESOLVED'
            differences.append(f"direction")
        field_statuses.append(field_status)

        # timestamp comparison
        if observed.get('timestamp') is None:
            field_status = 'UNRESOLVED'
            if 'timestamp' not in missing:
                missing.append('timestamp')
        elif predicted_time is None:
            field_status = 'UNRESOLVED'
        else:
            time_diff = abs(observed['timestamp'] - predicted_time)
            tolerance = config['timeToleranceSeconds']
            if time_diff <= tolerance:
                field_status = 'SUPPORTING'
                field_explanations.append(
                    f"The observed timestamp ({_format_time(observed['timestamp'])}) is within the configured time tolerance of the scenario's predicted time ({_format_time(predicted_time)})."
                )
            else:
                field_status = 'CONFLICTING'
                field_severity = _compose_conflict_severity(time_diff, tolerance)
                field_explanations.append(
                    f"The scenario predicts arrival at {_format_time(predicted_time)}, while the evidence records the observation at {_format_time(observed['timestamp'])}, resulting in a difference of {time_diff // 60} minutes."
                )
                conflicts.append({
                    'evidenceId': evidence_id,
                    'type': 'Timing Conflict',
                    'observed': _format_time(observed['timestamp']),
                    'predicted': _format_time(predicted_time),
                    'difference': f"{time_diff // 60} min",
                    'severity': field_severity,
                    'explanation': field_explanations[-1],
                })
                record_severity = record_severity or field_severity
            differences.append(f"time: {time_diff // 60} min")
        field_statuses.append(field_status)

        # derive overall status from per-field statuses
        if any(fs == 'CONFLICTING' for fs in field_statuses):
            record_status = 'CONFLICTING'
        elif any(fs == 'SUPPORTING' for fs in field_statuses):
            record_status = 'SUPPORTING'
        else:
            record_status = 'UNRESOLVED'

        if record_status == 'SUPPORTING':
            supporting += 1
        elif record_status == 'CONFLICTING':
            conflicting += 1
        else:
            unresolved += 1

        analysis_records.append({
            'evidenceId': evidence_id,
            'scenarioId': scenario.get('id'),
            'evidenceType': evidenced_type,
            'observedValue': {
                'position': _format_position(observed['position']),
                'distance': f"{observed['distance']} m" if observed['distance'] is not None else 'Unknown',
                'direction': observed.get('direction') or 'Unknown',
                'timestamp': observed.get('timestampRaw') or 'Unknown',
            },
            'predictedValue': {
                'position': predicted_position_display,
                'distance': f"{predicted_distance:.1f} m" if predicted_distance is not None else 'Unknown',
                'direction': predicted_direction or 'Unknown',
                'timestamp': _format_time(predicted_time) if predicted_time is not None else 'Unknown',
            },
            'difference': ', '.join(differences) if differences else '—',
            'status': record_status,
            'severity': record_severity,
            'explanation': ' '.join(field_explanations),
            'missingFields': missing,
        })

        if observed.get('timestamp') is not None:
            timeline.append({
                'evidenceId': evidence_id,
                'observedTime': _format_time(observed['timestamp']),
                'evidenceType': evidenced_type,
                'status': record_status,
                'explanation': ' '.join(field_explanations),
            })

    # overall timeline sort
    timeline.sort(key=lambda item: item.get('observedTime') or '')

    # gap detection
    if not evidence_list:
        gaps.append('No corresponding evidence was found for this part of the reconstruction.')
        recommendations.append('No matching evidence is available; review the reconstruction for unsupported path segments.')
    else:
        for evidence in evidence_list:
            missing = _missing_fields_for_evidence(evidence)
            if missing:
                gaps.extend([f"{field.capitalize()} information unavailable for Evidence {evidence.get('label') or evidence.get('id')}." for field in missing])
                if 'timestamp' in missing:
                    recommendations.append(f"Verify the timestamp associated with Evidence {evidence.get('label') or evidence.get('id')}.")
                if 'direction' in missing:
                    recommendations.append(f"Inspect the evidence source to determine movement direction for Evidence {evidence.get('label') or evidence.get('id')}.")
                if 'position' in missing:
                    recommendations.append(f"Verify the recorded position for Evidence {evidence.get('label') or evidence.get('id')}.")

    if conflicts:
        recommendations.append('Review the conflicting evidence items together before drawing conclusions.')

    # Deterministic status rules (explicit and simple). Map to final human-facing labels:
    # - Possible: no conflicts, at least one supporting (or supporting > 0)
    # - Not possible based on current evidence: more conflicts than supporting
    # - Cannot determine: no supporting/conflicting but unresolved items exist
    # - Partially supported -> treat as Possible (partial)
    # - Analysis pending/fallback -> Cannot determine
    if conflicting == 0 and supporting > 0 and unresolved == 0:
        overall_status = 'SUPPORTED'
    elif conflicting > supporting:
        overall_status = 'CONFLICTING'
    elif conflicting > 0 and supporting > 0:
        overall_status = 'PARTIALLY SUPPORTED'
    elif supporting == 0 and unresolved > 0:
        overall_status = 'INSUFFICIENT EVIDENCE'
    else:
        overall_status = 'INSUFFICIENT EVIDENCE'

    return {
        'analysisStatus': overall_status,
        'analysisCounts': {
            'supporting': supporting,
            'conflicting': conflicting,
            'unresolved': unresolved,
        },
        'evidenceAnalysis': analysis_records,
        'analysisTimeline': timeline,
        'analysisConflicts': conflicts,
        'analysisGaps': gaps,
        'analysisRecommendations': recommendations,
        'analysisLastUpdated': datetime.utcnow().isoformat(),
    }
