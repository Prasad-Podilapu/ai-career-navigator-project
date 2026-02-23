from django.urls import path
from . import views

urlpatterns = [
    path("", views.home, name="home"),
    path("upload/", views.upload_page, name="upload"),
    path("analyze/", views.analyze_api, name="analyze"),
    path("result/", views.result_page, name="result"),
]
