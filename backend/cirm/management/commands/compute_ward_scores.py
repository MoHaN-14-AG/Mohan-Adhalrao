"""
Django Management Command: compute_ward_scores
Calculates composite Ward Accountability Scores for all MBMC Wards.

Formula (Single Commented Function in score_calculator.py):
score = 40% resolution rate + 25% speed (faster = higher) + 15% (1 - reopened ratio) + 20% fund utilisation
"""

import csv
from pathlib import Path
from django.core.management.base import BaseCommand
from django.utils import timezone
from django.conf import settings
from cirm.models import Ward, Complaint, ComplaintStatus, WardScore
from cirm.score_calculator import calculate_ward_score


class Command(BaseCommand):
    help = "Computes monthly ward accountability scores using complaints and CityFinance CSV data."

    def add_arguments(self, parser):
        parser.add_argument(
            '--month',
            type=str,
            default=timezone.now().strftime('%B %Y'),
            help='Reporting month label, e.g. "October 2026"'
        )

    def handle(self, *args, **options):
        month = options['month']
        self.stdout.write(f"Computing Ward Accountability Scores for {month}...")

        # 1. Read CityFinance stand-in data from CSV
        csv_path = Path(settings.BASE_DIR) / 'data' / 'ward_funds.csv'
        fund_map = {}

        if csv_path.exists():
            with open(csv_path, mode='r', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                for row in reader:
                    try:
                        wid = int(row['ward_id'])
                        pct = float(row['fund_utilisation_pct'])
                        fund_map[wid] = pct
                    except (ValueError, KeyError):
                        continue
        else:
            self.stdout.write(self.style.WARNING(f"CSV {csv_path} not found. Using default 80% fund utilisation."))

        # 2. Iterate through each MBMC Ward
        wards = Ward.objects.all()
        for ward in wards:
            complaints = Complaint.objects.filter(ward=ward)
            total_count = complaints.count()

            if total_count == 0:
                res_rate = 100.0
                avg_hours = 24.0
                reopen_ratio = 0.0
            else:
                resolved_tickets = complaints.filter(
                    status__in=[ComplaintStatus.RESOLVED, ComplaintStatus.CITIZEN_CONFIRMED]
                )
                res_count = resolved_tickets.count()
                res_rate = (res_count / total_count) * 100.0

                # Average response hours
                hours_list = []
                for t in resolved_tickets:
                    if t.resolved_at:
                        diff = (t.resolved_at - t.created_at).total_seconds() / 3600.0
                        hours_list.append(diff)
                avg_hours = sum(hours_list) / len(hours_list) if hours_list else 36.0

                # Reopened ratio
                reopened_count = complaints.filter(reopen_count__gt=0).count()
                reopen_ratio = (reopened_count / res_count * 100.0) if res_count > 0 else 0.0

            # Fund utilisation for this ward
            fund_util = fund_map.get(ward.id, 80.0)

            # 3. Apply the single clearly commented scoring formula
            final_score = calculate_ward_score(
                resolution_rate_pct=res_rate,
                avg_response_hours=avg_hours,
                reopened_ratio_pct=reopen_ratio,
                fund_utilisation_pct=fund_util
            )

            # 4. Save or update WardScore record
            ws, created = WardScore.objects.update_or_create(
                ward=ward,
                month=month,
                defaults={
                    'resolution_rate': round(res_rate, 1),
                    'avg_response_hours': round(avg_hours, 1),
                    'reopened_ratio': round(reopen_ratio, 1),
                    'fund_utilisation_pct': round(fund_util, 1),
                    'final_score': final_score,
                }
            )

            action_text = "Created" if created else "Updated"
            self.stdout.write(
                f"  [{action_text}] {ward.name:<28} -> Score: {final_score}/100 "
                f"(Res: {res_rate:.1f}%, Speed: {avg_hours:.1f}h, Reopened: {reopen_ratio:.1f}%, Funds: {fund_util:.1f}%)"
            )

        self.stdout.write(self.style.SUCCESS(f"Ward scores computation completed for {len(wards)} wards!"))
