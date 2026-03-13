from django.urls import path
from . import views

urlpatterns = [
    path("", views.home, name="home"),
    path("upload/", views.upload_page, name="upload"),
    path("analyze/", views.analyze_api, name="analyze"),
    path("download-ats-resume/", views.download_ats_resume, name="download_ats_resume"),
    path("result/", views.result_page, name="result"),
]
