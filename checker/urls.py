from django.contrib import admin
from django.urls import path
from checker import views

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', views.spell_check, name='spell_check'),
    path('spell-check/', views.spell_check, name='spell_check_api'),
]