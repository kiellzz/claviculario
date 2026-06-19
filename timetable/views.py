from datetime import date, time

from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet

from core.permissions import IsCoordenacao
from salas.models import Sala
from usuarios.models import Usuario

from .models import Timetable
from .serializers import TimetableSerializer


def parse_time(value):
	hora, minuto = value.split(":")
	return time(int(hora), int(minuto))


class TimetableViewSet(ModelViewSet):
	queryset = Timetable.objects.select_related("professor", "sala").all()
	serializer_class = TimetableSerializer
	permission_classes = [IsCoordenacao]
	filterset_fields = ["professor", "sala", "dia_semana"]

	@action(detail=False, methods=["post"], url_path="importar")
	def importar(self, request):
		criados = 0
		for item in request.data:
			professor = Usuario.objects.get(matricula=item["professor_matricula"])
			sala = Sala.objects.get(codigo=item["sala_codigo"])
			_, created = Timetable.objects.update_or_create(
				professor=professor,
				sala=sala,
				dia_semana=item["dia_semana"],
				hora_inicio=parse_time(item["hora_inicio"]),
				defaults={
					"hora_fim": parse_time(item["hora_fim"]),
					"vigencia_inicio": date.fromisoformat(item["vigencia_inicio"]),
					"vigencia_fim": date.fromisoformat(item["vigencia_fim"])
					if item.get("vigencia_fim")
					else None,
				},
			)
			criados += int(created)
		return Response({"importados": len(request.data), "criados": criados})