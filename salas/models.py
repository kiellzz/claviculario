import uuid

from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models


class Sala(models.Model):
	id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

	class TipoSalaChoices(models.TextChoices):
		LABORATORIO = "LAB", "Laboratorio"
		SALA_AULA = "SALA", "Sala de Aula"
		COZINHA = "COZINHA", "Cozinha"
		AUDITORIO = "AUDITORIO", "Auditorio"

	codigo = models.CharField(max_length=10, unique=True, blank=True)
	andar = models.PositiveSmallIntegerField(
		validators=[MinValueValidator(0), MaxValueValidator(22)]
	)
	numero = models.CharField(max_length=4)
	descricao = models.CharField(max_length=100, blank=True)
	tipo_sala = models.CharField(
		max_length=10,
		choices=TipoSalaChoices.choices,
		default=TipoSalaChoices.SALA_AULA,
	)

	def save(self, *args, **kwargs):
		if not self.codigo:
			self.codigo = f"{self.andar}{self.numero}".upper()
		super().save(*args, **kwargs)

	def __str__(self):
		return self.codigo
