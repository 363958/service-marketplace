from django.urls import path

from . import views

urlpatterns = [
    path("rooms/", views.list_rooms),
    path("rooms/<int:room_id>/messages/", views.room_messages),
    path("rooms/<int:room_id>/send/", views.send_message),
    path("rooms/<int:room_id>/mark-read/", views.mark_read),
    path("booking/<int:booking_id>/", views.room_for_booking),
]
