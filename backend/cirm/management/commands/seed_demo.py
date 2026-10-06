"""
Django Management Command: seed_demo
Populates SetuSeva CiRM with representative demo data for Mira-Bhayandar Municipal Corporation (MBMC).

Creates:
- 6 wards of Mira-Bhayandar
- 5 departments (Water, Sanitation, Roads, Electricity, Property Tax)
- 1 Admin user
- 2 Department Officers
- 10 Citizens with anchor records
- ~60 Complaints (mixed lifecycle states, duplicates, SLA breaches, reopens)
- ~20 Service Requests (including drafts aged > 3 days for silent friction)
- Citizen Feedback records
- Computes baseline Ward Accountability Scores
"""

import random
from datetime import timedelta
from django.core.management.base import BaseCommand
from django.core.management import call_command
from django.utils import timezone
from django.contrib.auth.models import User
from cirm.models import (
    UserProfile, RoleChoices, Ward, Department, Citizen,
    Complaint, ComplaintStatus, ServiceRequest, ServiceRequestStatus,
    Feedback
)
from cirm.routing_rules import determine_department_by_keywords


class Command(BaseCommand):
    help = "Seeds database with authentic MBMC demo records for student evaluation."

    def handle(self, *args, **options):
        self.stdout.write(self.style.WARNING("Starting MBMC SetuSeva demo database seeding..."))

        # Clear existing data in reverse dependency order
        Feedback.objects.all().delete()
        Complaint.objects.all().delete()
        ServiceRequest.objects.all().delete()
        Citizen.objects.all().delete()
        UserProfile.objects.all().delete()
        User.objects.exclude(is_superuser=True).delete()
        Ward.objects.all().delete()
        Department.objects.all().delete()

        # 1. WARDS (6 Administrative Wards of MBMC)
        wards_data = [
            ("Ward 1 - Mira Road East", 185000),
            ("Ward 2 - Mira Road West", 160000),
            ("Ward 3 - Bhayandar East", 210000),
            ("Ward 4 - Bhayandar West", 195000),
            ("Ward 5 - Uttan & Coastal", 95000),
            ("Ward 6 - Kashimira & Highway", 145000),
        ]
        ward_objs = []
        for name, pop in wards_data:
            w, _ = Ward.objects.get_or_create(name=name, defaults={'population': pop})
            ward_objs.append(w)
        self.stdout.write(self.style.SUCCESS(f"Created {len(ward_objs)} MBMC Wards."))

        # 2. DEPARTMENTS (5 Core Municipal Departments)
        dept_names = ['Water', 'Sanitation', 'Roads', 'Electricity', 'Property Tax']
        dept_map = {}
        for dname in dept_names:
            dept, _ = Department.objects.get_or_create(name=dname)
            dept_map[dname] = dept
        self.stdout.write(self.style.SUCCESS(f"Created {len(dept_map)} Municipal Departments."))

        # 3. USERS & ROLES
        # Admin
        admin_user, _ = User.objects.get_or_create(
            username='admin',
            defaults={
                'email': 'commissioner@mbmc.gov.in',
                'first_name': 'Municipal',
                'last_name': 'Commissioner',
                'is_staff': True,
                'is_superuser': True
            }
        )
        admin_user.set_password('admin123')
        admin_user.save()
        UserProfile.objects.get_or_create(user=admin_user, defaults={'role': RoleChoices.ADMIN})

        # Officer 1: Water Department
        off_water, _ = User.objects.get_or_create(
            username='officer_water',
            defaults={
                'email': 'water.officer@mbmc.gov.in',
                'first_name': 'Sanjay',
                'last_name': 'Kadam',
                'is_staff': True
            }
        )
        off_water.set_password('officer123')
        off_water.save()
        UserProfile.objects.get_or_create(
            user=off_water,
            defaults={'role': RoleChoices.OFFICER, 'department': dept_map['Water']}
        )

        # Officer 2: Sanitation Department
        off_san, _ = User.objects.get_or_create(
            username='officer_sanitation',
            defaults={
                'email': 'sanitation.officer@mbmc.gov.in',
                'first_name': 'Meena',
                'last_name': 'Sawant',
                'is_staff': True
            }
        )
        off_san.set_password('officer123')
        off_san.save()
        UserProfile.objects.get_or_create(
            user=off_san,
            defaults={'role': RoleChoices.OFFICER, 'department': dept_map['Sanitation']}
        )

        # 10 Citizens (ANCHOR TABLE)
        citizens_meta = [
            ("citizen_rahul", "Rahul", "Sharma", "9820011221", ward_objs[0], "hi"),
            ("citizen_priya", "Priya", "Patil", "9820011222", ward_objs[1], "mr"),
            ("citizen_amit", "Amit", "Verma", "9820011223", ward_objs[2], "en"),
            ("citizen_sneha", "Sneha", "Deshmukh", "9820011224", ward_objs[3], "mr"),
            ("citizen_vikram", "Vikram", "Yadav", "9820011225", ward_objs[4], "hi"),
            ("citizen_ananya", "Ananya", "Nair", "9820011226", ward_objs[5], "en"),
            ("citizen_rohit", "Rohit", "Jadhav", "9820011227", ward_objs[0], "mr"),
            ("citizen_pooja", "Pooja", "Gupta", "9820011228", ward_objs[1], "hi"),
            ("citizen_suresh", "Suresh", "Chavan", "9820011229", ward_objs[2], "mr"),
            ("citizen_kavita", "Kavita", "Shah", "9820011230", ward_objs[3], "en"),
        ]

        citizen_objs = []
        for uname, fname, lname, phone, ward, lang in citizens_meta:
            u, _ = User.objects.get_or_create(
                username=uname,
                defaults={'first_name': fname, 'last_name': lname, 'email': f"{uname}@example.com"}
            )
            u.set_password('citizen123')
            u.save()
            UserProfile.objects.get_or_create(user=u, defaults={'role': RoleChoices.CITIZEN})
            c, _ = Citizen.objects.get_or_create(
                user=u,
                defaults={'phone': phone, 'ward': ward, 'preferred_language': lang}
            )
            citizen_objs.append(c)

        self.stdout.write(self.style.SUCCESS(f"Created 1 Admin, 2 Officers, and {len(citizen_objs)} Citizens."))

        # 4. COMPLAINTS (~60 realistic complaints)
        sample_complaints = [
            ("Water Leakage", "Main pipeline burst near Shanti Park signal, clean water leaking continuously on road.", "Shanti Park, Station Road"),
            ("Garbage Dump", "Heavy garbage accumulation near vegetable market, foul smell and overflowing bins.", "Near APMC Market, Bhayandar West"),
            ("Road Pothole", "Dangerous pothole cluster on Western Express highway junction causing bike accidents.", "Kashimira Flyover Service Road"),
            ("Street Light Failure", "Street light pole #24 dark for 4 days, pitch dark alley near school.", "Sheetal Nagar, Near St. Xavier's"),
            ("Sewage Overflow", "Open drain choked with plastic waste, black drainage spilling into footpath.", "Silver Park, Kanakia Road"),
            ("Low Water Pressure", "Low water pressure in municipal supply line during morning 6 AM hours.", "Geeta Nagar, Phase 3"),
            ("Broken Footpath", "Broken concrete slabs on pavement with exposed iron rebars.", "Maxus Mall Junction"),
            ("Property Tax Assessment Query", "Property tax assessment invoice shows duplicate penalty despite prior payment receipt.", "Bhayandar East Ward Office area"),
            ("Street Light Sparking", "Overhead electrical wire sparking against tree branch in strong wind.", "Uttan Beach Road near church"),
            ("Dead Animal Removal", "Dead stray dog on roadside near garbage collection point.", "Poonam Sagar Complex"),
            ("Contaminated Water", "Muddy tap water with foul smell received today morning.", "Navghar Road, Cabin Crossroad"),
            ("Road Resurfacing Needed", "Unpaved dug up road left after storm drain work unfinished.", "Indralok Phase 4, Bhayandar East"),
        ]

        now = timezone.now()
        complaint_objs = []

        statuses_pool = [
            ComplaintStatus.SUBMITTED,
            ComplaintStatus.ROUTED,
            ComplaintStatus.IN_PROGRESS,
            ComplaintStatus.RESOLVED,
            ComplaintStatus.CITIZEN_CONFIRMED,
        ]

        for i in range(60):
            cat, desc, loc = random.choice(sample_complaints)
            citizen = random.choice(citizen_objs)
            ward = citizen.ward

            # Apply Keyword Routing
            dept_name, _ = determine_department_by_keywords(f"{cat} {desc}")
            department = dept_map.get(dept_name, dept_map['Sanitation'])

            # Date distribution over the past 14 days
            days_ago = random.uniform(0.1, 14.0)
            created_at = now - timedelta(days=days_ago)

            # Standard 72 hour SLA
            sla_due_at = created_at + timedelta(hours=72)

            # Random status with realistic weighting
            status_choice = random.choices(
                statuses_pool,
                weights=[15, 20, 25, 20, 20],
                k=1
            )[0]

            resolved_at = None
            if status_choice in [ComplaintStatus.RESOLVED, ComplaintStatus.CITIZEN_CONFIRMED]:
                # Resolution took between 12 to 80 hours
                hours_to_resolve = random.uniform(12.0, 80.0)
                resolved_at = created_at + timedelta(hours=hours_to_resolve)
                if resolved_at > now:
                    resolved_at = now - timedelta(hours=2)

            # Some tickets reopened by citizen (first-time fix metric)
            reopen_count = random.choice([0, 0, 0, 0, 1, 2]) if status_choice != ComplaintStatus.SUBMITTED else 0

            # Duplicate flag if same category already exists in that ward
            is_dup = (i % 7 == 0)

            c = Complaint.objects.create(
                citizen=citizen,
                ward=ward,
                department=department,
                category=cat,
                description=desc,
                location_text=loc,
                status=status_choice,
                created_at=created_at,
                sla_due_at=sla_due_at,
                resolved_at=resolved_at,
                is_duplicate=is_dup,
                reopen_count=reopen_count
            )
            complaint_objs.append(c)

        self.stdout.write(self.style.SUCCESS(f"Created {len(complaint_objs)} Complaints with SLA and routing."))

        # 5. FEEDBACK (~15 feedback ratings for confirmed complaints)
        confirmed_complaints = [c for c in complaint_objs if c.status == ComplaintStatus.CITIZEN_CONFIRMED]
        feedback_comments = [
            (5, "Very fast resolution! Water supply was restored in 14 hours. Thank you MBMC."),
            (4, "Sanitation truck cleared the heap completely. Good work by ward supervisor."),
            (5, "Pothole filled with cold mix bitumen promptly. Safe to drive now."),
            (3, "Fixed but took 3 days. Workmanship could be improved."),
            (4, "Streetlight is functional again. Grateful for quick inspection."),
            (2, "Water pressure improved slightly but still intermittent."),
        ]

        for c in confirmed_complaints[:15]:
            rating, comment = random.choice(feedback_comments)
            Feedback.objects.create(
                citizen=c.citizen,
                complaint=c,
                rating=rating,
                comment=comment,
                created_at=c.resolved_at or now
            )
        self.stdout.write(self.style.SUCCESS("Created Feedback entries for confirmed complaints."))

        # 6. SERVICE REQUESTS (~20 requests, some abandoned for silent friction SOP)
        sr_templates = [
            ("certificate", "Birth Certificate Copy Request", "Application for duplicate birth certificate issued in 2018."),
            ("certificate", "Zone Verification Certificate", "Residential zoning status verification for property sale."),
            ("permit", "Trade License Renewal", "Annual renewal application for grocery shop in Sector 4."),
            ("permit", "Tree Trimming Safety Permit", "Permission to trim overgrown banyan branch leaning on residential balcony."),
            ("tax", "Property Tax Self Assessment", "Re-assessment of newly constructed additional room."),
            ("tax", "Water Meter Commercial Conversion", "Application to install metered industrial water line.")
        ]

        for i in range(22):
            stype, stitle, sdetails = random.choice(sr_templates)
            citizen = random.choice(citizen_objs)
            days_ago = random.uniform(0.5, 10.0)
            created_at = now - timedelta(days=days_ago)

            # If draft and created > 3 days ago, mark as ABANDONED (Silent friction SOP)
            if i % 4 == 0 and days_ago > 3.0:
                s_status = ServiceRequestStatus.ABANDONED
            elif i % 5 == 0:
                s_status = ServiceRequestStatus.DRAFT
            elif i % 3 == 0:
                s_status = ServiceRequestStatus.PROCESSING
            elif i % 2 == 0:
                s_status = ServiceRequestStatus.COMPLETED
            else:
                s_status = ServiceRequestStatus.SUBMITTED

            ServiceRequest.objects.create(
                citizen=citizen,
                type=stype,
                title=f"{stitle} #{i+101}",
                details=sdetails,
                status=s_status,
                created_at=created_at
            )
        self.stdout.write(self.style.SUCCESS("Created 22 Service Requests (including abandoned drafts)."))

        # 7. COMPUTE INITIAL WARD ACCOUNTABILITY SCORES
        self.stdout.write("Calculating initial Ward Accountability Scores...")
        call_command('compute_ward_scores')

        # 8. PRINT DEMO LOGIN CREDENTIALS
        self.stdout.write("\n" + "=" * 65)
        self.stdout.write(self.style.SUCCESS("  MBMC SETUSEVA DEMO SEEDING COMPLETED SUCCESSFULLY!"))
        self.stdout.write("=" * 65)
        self.stdout.write("\nDEMO USER CREDENTIALS FOR TESTING:")
        self.stdout.write("-----------------------------------------------------------------")
        self.stdout.write(f"1. ADMIN:      Username: {'admin':<18} Password: {'admin123'}")
        self.stdout.write(f"2. OFFICER:    Username: {'officer_water':<18} Password: {'officer123'} (Water Dept)")
        self.stdout.write(f"3. OFFICER:    Username: {'officer_sanitation':<18} Password: {'officer123'} (Sanitation Dept)")
        self.stdout.write(f"4. CITIZEN 1:  Username: {'citizen_rahul':<18} Password: {'citizen123'} (Ward 1, Hindi)")
        self.stdout.write(f"5. CITIZEN 2:  Username: {'citizen_priya':<18} Password: {'citizen123'} (Ward 2, Marathi)")
        self.stdout.write(f"6. CITIZEN 3:  Username: {'citizen_amit':<18} Password: {'citizen123'} (Ward 3, English)")
        self.stdout.write("-----------------------------------------------------------------")
        self.stdout.write("All 10 demo citizens use password: citizen123")
        self.stdout.write("=" * 65 + "\n")
