from typing import List, Dict, Any, Optional
import math

def parse_measurement_value(value: Optional[str]) -> Optional[float]:
    if not value:
        return None
    import re
    m = re.search(r'-?\d+(?:\.\d+)?', value)
    return float(m.group(0)) if m else None

def has_valid_coords(item: Dict[str, Any]) -> bool:
    return isinstance(item.get('position', {}).get('x'), (int, float)) and isinstance(item.get('position', {}).get('z'), (int, float))

def build_calculations(evidence: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    calculations = []
    if not evidence:
        return calculations

    for item in evidence:
        x = item.get('position', {}).get('x')
        z = item.get('position', {}).get('z')
        if has_valid_coords(item):
            calculations.append({
                'id': f"{item.get('label')}-position",
                'evidenceId': item.get('id') or item.get('label'),
                'title': f"{item.get('label')} position",
                'formula': 'P = (x, z)',
                'inputs': f"{x:.1f}, {z:.1f}",
                'calculation': 'Coordinates were read from the evidence position in the scene plane.',
                'result': f"({x:.1f}, {z:.1f}) m",
                'assumptions': 'Flat reference plane and metres-based coordinates',
                'units': 'm',
                'category': 'position',
            })

        length = parse_measurement_value(item.get('measurements', {}).get('length'))
        width = parse_measurement_value(item.get('measurements', {}).get('width'))
        if length is not None or width is not None:
            calculations.append({
                'id': f"{item.get('label')}-measurement",
                'evidenceId': item.get('id') or item.get('label'),
                'title': f"{item.get('label')} measurement",
                'formula': 'Length and width are interpreted from recorded measurements',
                'inputs': f"{item.get('measurements', {}).get('length', 'N/A')} and {item.get('measurements', {}).get('width', 'N/A')}",
                'calculation': 'Measured dimensions are preserved as recorded from the evidence notes.',
                'result': f"{item.get('measurements', {}).get('length', 'N/A')} × {item.get('measurements', {}).get('width', 'N/A')}",
                'assumptions': 'Measurement values are treated as direct field observations',
                'units': 'mm',
                'category': 'measurement',
            })

        if item.get('type') == 'Simulated Stain':
            major = parse_measurement_value(item.get('measurements', {}).get('majorAxis'))
            minor = parse_measurement_value(item.get('measurements', {}).get('minorAxis'))
            if major is not None and minor is not None and minor > 0:
                ratio = major / minor
                calculations.append({
                    'id': f"{item.get('label')}-ellipse",
                    'evidenceId': item.get('id') or item.get('label'),
                    'title': f"{item.get('label')} ellipse geometry",
                    'formula': 'ratio = major axis / minor axis',
                    'inputs': f"{major:.1f} and {minor:.1f}",
                    'calculation': f"Ratio = {ratio:.2f}",
                    'result': f"{ratio:.2f} ratio",
                    'assumptions': 'Elliptical geometry is interpreted from the recorded major and minor axes',
                    'units': 'ratio',
                    'category': 'ellipse',
                })

    # pairwise relationships
    n = len(evidence)
    for i in range(n):
        for j in range(i + 1, n):
            a = evidence[i]
            b = evidence[j]
            if not (has_valid_coords(a) and has_valid_coords(b)):
                continue
            dx = b['position']['x'] - a['position']['x']
            dz = b['position']['z'] - a['position']['z']
            distance = math.hypot(dx, dz)
            calculations.append({
                'id': f"{a.get('label')}-{b.get('label')}-distance",
                'evidenceId': a.get('id') or a.get('label'),
                'title': f"{a.get('label')} to {b.get('label')}",
                'formula': 'd = √((x₂ − x₁)² + (z₂ − z₁)²)',
                'inputs': f"{a.get('label')} ({a['position']['x']:.1f}, {a['position']['z']:.1f}) and {b.get('label')} ({b['position']['x']:.1f}, {b['position']['z']:.1f})",
                'calculation': f"Δx = {dx:.2f} and Δz = {dz:.2f}",
                'result': f"{distance:.2f} m",
                'assumptions': 'Distance was computed on the same flat scene plane',
                'units': 'm',
                'category': 'distance',
            })

            if a.get('type') == 'Footprint' and b.get('type') == 'Footprint':
                calculations.append({
                    'id': f"{a.get('label')}-{b.get('label')}-stride",
                    'evidenceId': a.get('id') or a.get('label'),
                    'title': f"{a.get('label')} to {b.get('label')} stride",
                    'formula': 'stride = Euclidean distance between consecutive footprints',
                    'inputs': f"{a.get('label')} and {b.get('label')}",
                    'calculation': f"Stride length = {distance:.2f} m",
                    'result': f"{distance:.2f} m",
                    'assumptions': 'Stride is derived from the consecutive footprint spacing in the scene',
                    'units': 'm',
                    'category': 'stride',
                })


    return calculations
