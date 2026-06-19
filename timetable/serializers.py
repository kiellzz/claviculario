from rest_framework import serializers

from .models import Timetable


class TimetableSerializer(serializers.ModelSerializer):
	class Meta:
		model = Timetable
		fields = [
			"id",
			"professor",
			"sala",
			"dia_semana",
			"hora_inicio",
			"hora_fim",
			"vigencia_inicio",
			"vigencia_fim",
		]
		read_only_fields = ["id"]