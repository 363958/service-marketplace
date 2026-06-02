from datetime import time


def time_ranges_overlap(start1: time, end1: time, start2: time, end2: time) -> bool:
    """True if [start1, end1) overlaps [start2, end2)."""
    return start1 < end2 and start2 < end1


def slot_overlaps(provider_id, slot_date, start_time, end_time, exclude_id=None) -> bool:
    from .models import AvailabilitySlot

    qs = AvailabilitySlot.objects.filter(provider_id=provider_id, date=slot_date)
    if exclude_id:
        qs = qs.exclude(pk=exclude_id)
    for slot in qs:
        if time_ranges_overlap(start_time, end_time, slot.start_time, slot.end_time):
            return True
    return False
