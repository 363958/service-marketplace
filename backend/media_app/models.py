from django.conf import settings
from django.db import models


class MediaFile(models.Model):
    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="media_files",
    )
    file = models.FileField(upload_to="uploads/%Y/%m/")
    purpose = models.CharField(max_length=50, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
