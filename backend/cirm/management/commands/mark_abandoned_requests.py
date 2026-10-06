"""
Django Management Command: mark_abandoned_requests
Implements the 'Silent Friction' SOP requirement.

If a citizen starts a municipal service application (certificate, permit, tax)
and it stays in 'draft' status for more than 3 days without submission,
this command flags it as 'abandoned'. This allows MBMC leadership to pinpoint
which services have drop-offs due to confusing paperwork or document friction.
"""

from datetime import timedelta
from django.core.management.base import BaseCommand
from django.utils import timezone
from cirm.models import ServiceRequest, ServiceRequestStatus


class Command(BaseCommand):
    help = "Finds draft service requests older than 3 days and marks them as abandoned (silent friction)."

    def handle(self, *args, **options):
        cutoff = timezone.now() - timedelta(days=3)

        stuck_drafts = ServiceRequest.objects.filter(
            status=ServiceRequestStatus.DRAFT,
            created_at__lte=cutoff
        )

        count = stuck_drafts.count()
        if count == 0:
            self.stdout.write(self.style.SUCCESS("No abandoned drafts found (> 3 days)."))
            return

        updated_count = stuck_drafts.update(status=ServiceRequestStatus.ABANDONED)
        self.stdout.write(
            self.style.WARNING(
                f"Flagged {updated_count} service requests as 'abandoned' due to inactivity (> 3 days in draft)."
            )
        )
