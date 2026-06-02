from django.urls import path

from .views import MediaUploadView, MediaUploadBase64View

urlpatterns = [
    path("upload/", MediaUploadView.as_view()),
    path("upload-base64/", MediaUploadBase64View.as_view()),
]
