from django import forms

from .models import Timetable


class TimetableForm(forms.ModelForm):
	class Meta:
		model = Timetable
		fields = [
			"professor",
			"sala",
			"dia_semana",
			"hora_inicio",
			"hora_fim",
			"vigencia_inicio",
			"vigencia_fim",
		]
