import math
from typing import Dict, List


def _point_dist(a: Dict, b: Dict) -> float:
    ax, ay, az = a.get('x', 0), a.get('y', 0), a.get('z', 0)
    bx, by, bz = b.get('x', 0), b.get('y', 0), b.get('z', 0)
    return math.sqrt((ax - bx) ** 2 + (ay - by) ** 2 + (az - bz) ** 2)


def _angle_deg(a: Dict, b: Dict) -> float:
    dx = b.get('x', 0) - a.get('x', 0)
    dz = b.get('z', 0) - a.get('z', 0)
    return math.degrees(math.atan2(dz, dx))


def _angle_diff(a_deg: float, b_deg: float) -> float:
    d = abs((a_deg - b_deg + 180) % 360 - 180)
    return d


def compute_consistency(scenario: Dict, evidence: List[Dict]) -> Dict:
    """
    Compute detailed, deterministic dimension scores for a scenario.

    Returns a dict containing:
      - consistencyIndex: int (0-100)
      - dimensionScores: {distance, direction, stride, position} (each 0-100)
      - weights: used weights for the final score
      - evidenceDeviations: list of per-evidence dicts with distance, directionDiff, strideDiff
      - math: supplemental math values like avgDistance, bboxDiagonal
    """
    path = scenario.get('pathPoints') or []
    if not path or not evidence:
        return {
            'consistencyIndex': 0,
            'dimensionScores': {'distance': 0, 'direction': 0, 'stride': 0, 'position': 0},
            'weights': {'distance': 0.3, 'direction': 0.25, 'stride': 0.25, 'position': 0.2},
            'evidenceDeviations': [],
            'math': {'avgDistance': None, 'bboxDiagonal': 0.0},
        }

    # collect evidence positions
    pos_list = []
    xs, ys, zs = [], [], []
    for e in evidence:
        p = e.get('position') or {}
        x = p.get('x', 0)
        y = p.get('y', 0)
        z = p.get('z', 0)
        pos_list.append({'label': e.get('label'), 'x': x, 'y': y, 'z': z, 'measurements': e.get('measurements', {}), 'type': e.get('type')})
        xs.append(x); ys.append(y); zs.append(z)

    minx, maxx = min(xs), max(xs)
    miny, maxy = min(ys), max(ys)
    minz, maxz = min(zs), max(zs)
    bbox_diagonal = math.sqrt((maxx - minx) ** 2 + (maxy - miny) ** 2 + (maxz - minz) ** 2)
    if bbox_diagonal == 0:
        bbox_diagonal = 1.0

    # per-evidence deviations
    evidence_devs = []
    distances = []
    angles = []
    stride_devs = []

    # precompute path segment directions for nearest-segment approach
    segments = []
    for i in range(len(path) - 1):
        a = path[i]
        b = path[i + 1]
        seg_angle = math.degrees(math.atan2(b.get('z', 0) - a.get('z', 0), b.get('x', 0) - a.get('x', 0)))
        segments.append({'a': a, 'b': b, 'angle': seg_angle})

    for pe in pos_list:
        # closest distance to any path point
        min_d = min(_point_dist(pe, pp) for pp in path)
        distances.append(min_d)

        # nearest segment angle
        if segments:
            # find nearest segment by distance to its endpoints
            seg_dists = [min(_point_dist(pe, s['a']), _point_dist(pe, s['b'])) for s in segments]
            best_idx = seg_dists.index(min(seg_dists))
            seg_angle = segments[best_idx]['angle']
        else:
            seg_angle = 0.0

        # evidence orientation if present
        orient = None
        m = pe.get('measurements', {})
        if m:
            # try orientation, direction, or bearing fields
            for key in ('orientation', 'direction', 'bearing'):
                v = m.get(key)
                if v is not None:
                    try:
                        import re
                        mo = re.search(r'-?\d+(?:\.\d+)?', str(v))
                        if mo:
                            orient = float(mo.group(0))
                            break
                    except Exception:
                        pass

        if orient is None:
            # fallback: no orientation -> treat as neutral; record None
            angle_diff = None
        else:
            angle_diff = _angle_diff(seg_angle, orient)
            angles.append(angle_diff)

        # stride deviation: if evidence is footprint and nearby another footprint
        stride_diff_val = None
        if pe.get('type') == 'Footprint':
            # find nearest other footprint
            others = [o for o in pos_list if o is not pe and o.get('type') == 'Footprint']
            if others:
                dvals = [ _point_dist(pe, o) for o in others ]
                nearest = min(dvals)
                # approximate expected stride from nearest path segments: mean segment length
                seg_lengths = [ _point_dist(s['a'], s['b']) for s in segments ] if segments else [nearest]
                expected_stride = sum(seg_lengths) / len(seg_lengths) if seg_lengths else nearest
                stride_diff_val = abs(nearest - expected_stride)
                stride_devs.append(stride_diff_val)

        evidence_devs.append({'label': pe.get('label'), 'distance': min_d, 'directionDiff': angle_diff, 'strideDiff': stride_diff_val})

    avg_dist = sum(distances) / len(distances) if distances else float('inf')

    # dimension scores
    # Distance alignment: inverse of normalized avg distance
    dist_score = max(0.0, 1.0 - (avg_dist / bbox_diagonal)) * 100

    # Direction alignment: average angular difference -> normalized (0 deg => 100, 180 deg => 0)
    dir_score = 100.0
    if angles:
        avg_angle = sum(angles) / len(angles)
        dir_score = max(0.0, 1.0 - (avg_angle / 180.0)) * 100

    # Stride pattern: compare average stride deviation relative to bbox diagonal
    stride_score = 100.0
    if stride_devs:
        avg_stride_dev = sum(stride_devs) / len(stride_devs)
        # larger deviation -> lower score; normalize by bbox diagonal
        stride_score = max(0.0, 1.0 - (avg_stride_dev / bbox_diagonal)) * 100

    # Position overlap: proportion of evidence within a tolerance (10% diag)
    tol = bbox_diagonal * 0.1
    close_count = sum(1 for d in distances if d <= tol)
    pos_score = (close_count / len(distances)) * 100 if distances else 0.0

    # weights
    weights = {'distance': 0.3, 'direction': 0.25, 'stride': 0.25, 'position': 0.2}

    combined = dist_score * weights['distance'] + dir_score * weights['direction'] + stride_score * weights['stride'] + pos_score * weights['position']
    consistency = int(round(combined))

    return {
        'consistencyIndex': consistency,
        'dimensionScores': {
            'distance': int(round(dist_score)),
            'direction': int(round(dir_score)),
            'stride': int(round(stride_score)),
            'position': int(round(pos_score)),
        },
        'weights': weights,
        'evidenceDeviations': evidence_devs,
        'math': {
            'avgDistance': avg_dist,
            'bboxDiagonal': bbox_diagonal,
            'distances': distances,
            'angles': angles,
            'strideDeviations': stride_devs,
        }
    }
