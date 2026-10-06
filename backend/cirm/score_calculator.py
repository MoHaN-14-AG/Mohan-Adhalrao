"""
SetuSeva Ward Accountability Score Calculator.
Implements the exact formula specified in the MBMC CiRM project requirements.
Keep the formula in ONE clearly commented function so engineering students
can understand, verify, and explain every parameter during project evaluation.
"""

def calculate_ward_score(
    resolution_rate_pct: float,
    avg_response_hours: float,
    reopened_ratio_pct: float,
    fund_utilisation_pct: float
) -> float:
    """
    Computes the composite Ward Accountability Score out of 100.

    FORMULA BREAKDOWN:
    - 40% Resolution Rate:
        Percentage of total complaints resolved or confirmed by citizens.
        Range: 0% to 100%.

    - 25% Speed (SLA Responsiveness):
        Faster resolution yields higher points.
        Baseline: 72 hours SLA target.
        If avg_response_hours <= 12 hours -> 100 points
        If avg_response_hours == 72 hours (on SLA boundary) -> 60 points
        If avg_response_hours >= 144 hours -> 0 points
        Formula: max(0.0, min(100.0, 100.0 - (avg_response_hours / 144.0) * 100.0))

    - 15% Citizen Satisfaction / First-Time Fix:
        (1 - Reopened Ratio) * 100
        Low reopened count means high quality repair on first attempt.

    - 20% Fund Utilisation:
        Direct percentage from municipal budget data (CityFinance.in stand-in CSV).
        Range: 0% to 100%.

    Final Score = (0.40 * Resolution) + (0.25 * Speed) + (0.15 * FirstTimeFix) + (0.20 * FundUtil)
    """

    # 1. Resolution component (0 - 100)
    res_component = max(0.0, min(100.0, resolution_rate_pct))

    # 2. Speed component (0 - 100, where lower hours = higher score)
    if avg_response_hours <= 0:
        speed_component = 100.0
    else:
        # 144 hours (6 days) is the zero-point threshold
        speed_component = max(0.0, min(100.0, 100.0 - (avg_response_hours / 144.0) * 100.0))

    # 3. First-Time Fix component (0 - 100, where lower reopened ratio = higher score)
    first_time_fix_component = max(0.0, min(100.0, 100.0 - reopened_ratio_pct))

    # 4. Fund Utilisation component (0 - 100)
    fund_component = max(0.0, min(100.0, fund_utilisation_pct))

    # Weighted calculation
    final_score = (
        (0.40 * res_component) +
        (0.25 * speed_component) +
        (0.15 * first_time_fix_component) +
        (0.20 * fund_component)
    )

    # Round to 1 decimal place for clean municipal scorecard display
    return round(final_score, 1)
