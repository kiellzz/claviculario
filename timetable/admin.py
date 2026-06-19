from django.contrib import admin

from .models import Timetable


@admin.register(Timetable)
class TimetableAdmin(admin.ModelAdmin):
	list_display = ("professor", "sala", "dia_semana", "hora_inicio", "hora_fim")
	list_filter = ("dia_semana", "sala")
	search_fields = ("professor__matricula", "professor__nome", "sala__codigo")
