import json
from datetime import date, time

from django.core.management.base import BaseCommand

from salas.models import Sala
from timetable.models import Timetable
from usuarios.models import Usuario


def parse_time(value):
	hora, minuto = value.split(":")
	return time(int(hora), int(minuto))


class Command(BaseCommand):
	help = "Importa timetable a partir de JSON mock."

	def add_arguments(self, parser):
		parser.add_argument("arquivo_json")

	def handle(self, *args, **options):
		with open(options["arquivo_json"], encoding="utf-8") as arquivo:
			registros = json.load(arquivo)
		criados = 0
		for item in registros:
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
		self.stdout.write(self.style.SUCCESS(f"Timetable importado. Novos registros: {criados}"))
