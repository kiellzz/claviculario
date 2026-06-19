import uuid

from django.core.exceptions import ValidationError
from django.db import models


class Timetable(models.Model):
	id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

	class DiaSemanaChoices(models.IntegerChoices):
		SEGUNDA = 0, "Segunda"
		TERCA = 1, "Terca"
		QUARTA = 2, "Quarta"
		QUINTA = 3, "Quinta"
		SEXTA = 4, "Sexta"
		SABADO = 5, "Sabado"
		DOMINGO = 6, "Domingo"

	professor = models.ForeignKey(
		"usuarios.Usuario", on_delete=models.CASCADE, related_name="horarios"
	)
	sala = models.ForeignKey("salas.Sala", on_delete=models.CASCADE, related_name="horarios")
	dia_semana = models.PositiveSmallIntegerField(choices=DiaSemanaChoices.choices)
	hora_inicio = models.TimeField()
	hora_fim = models.TimeField()
	vigencia_inicio = models.DateField()
	vigencia_fim = models.DateField(null=True, blank=True)

	def clean(self):
		if self.professor and self.professor.papel != "professor":
			raise ValidationError("Timetable deve apontar para usuario professor.")
		if self.hora_fim <= self.hora_inicio:
			raise ValidationError("Hora fim deve ser posterior a hora inicio.")
		if self.vigencia_fim and self.vigencia_fim < self.vigencia_inicio:
			raise ValidationError("Vigencia final deve ser posterior ao inicio.")

	def __str__(self):
		return f"{self.professor} - {self.sala} ({self.dia_semana})"

	class Meta:
		indexes = [
			models.Index(fields=["professor", "dia_semana"], name="idx_timetable_prof_dia"),
		]
