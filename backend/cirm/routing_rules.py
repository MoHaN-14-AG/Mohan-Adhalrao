"""
SetuSeva Keyword-Based Routing Engine.
Simple, explainable rule-based routing to municipal departments.
Strictly NO Machine Learning - transparent and deterministic for students.
"""

from typing import Tuple

# Mapping of keywords to MBMC Departments
DEPARTMENT_KEYWORD_RULES = {
    'Water': [
        'water', 'leak', 'pipeline', 'tap', 'supply', 'meter', 'contamination',
        'dirty water', 'low pressure', 'drainage pipe', 'tanker', 'jal'
    ],
    'Sanitation': [
        'garbage', 'drain', 'sewage', 'trash', 'waste', 'cleaning', 'dump',
        'gutter', 'overflow', 'debris', 'dead animal', 'kachra', 'sweeping'
    ],
    'Roads': [
        'road', 'pothole', 'asphalt', 'footpath', 'divider', 'pavement',
        'street', 'crater', 'speed breaker', 'resurfacing', 'traffic light', 'rasta'
    ],
    'Electricity': [
        'light', 'street light', 'pole', 'power', 'shock', 'electricity',
        'transformer', 'spark', 'blackout', 'wire', 'cable', 'bijli'
    ],
    'Property Tax': [
        'tax', 'assessment', 'property', 'bill', 'receipt', 'challan',
        'house tax', 'valuation', 'mutation', 'penalty'
    ]
}


def determine_department_by_keywords(text: str) -> Tuple[str, str]:
    """
    Scans the complaint text (category + description) for department keywords.
    Returns:
        (department_name, matched_reason)
    """
    normalized_text = (text or '').lower()

    # Check each department's keyword list
    for dept_name, keywords in DEPARTMENT_KEYWORD_RULES.items():
        for kw in keywords:
            if kw in normalized_text:
                return dept_name, f"Matched keyword '{kw}'"

    # Default fallback department when no specific keywords are detected
    return 'Sanitation', "Default department fallback (no specific keyword match)"
