from django.utils import timezone

from .models import Timetable


def professor_esta_no_horario(professor, sala, agora=None):
	agora = agora or timezone.now()
	return Timetable.objects.filter(
		professor=professor,
		sala=sala,
		dia_semana=agora.weekday(),
		hora_inicio__lte=agora.time(),
		hora_fim__gte=agora.time(),
		vigencia_inicio__lte=agora.date(),
	).filter(vigencia_fim__isnull=True).exists() or Timetable.objects.filter(
		professor=professor,
		sala=sala,
		dia_semana=agora.weekday(),
		hora_inicio__lte=agora.time(),
		hora_fim__gte=agora.time(),
		vigencia_inicio__lte=agora.date(),
		vigencia_fim__gte=agora.date(),
	).exists()
