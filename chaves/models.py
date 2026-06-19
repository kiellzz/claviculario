import uuid

from django.core.validators import RegexValidator
from django.db import models

from shared.security import hash_rfid


class Chave(models.Model):
	id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

	class StatusChoices(models.TextChoices):
		DISPONIVEL = "disponivel", "Disponivel"
		EMPRESTADA = "emprestada", "Emprestada"
		EM_TRANSITO = "em_transito", "Em transito"
		MANUTENCAO = "manutencao", "Manutencao"

	sala = models.ForeignKey("salas.Sala", on_delete=models.PROTECT, related_name="chaves")
	numero = models.CharField(
		max_length=4,
		validators=[
			RegexValidator(regex=r"^\d{4}$", message="O numero deve conter 4 digitos.")
		],
	)
	rfid_tag = models.CharField(max_length=64, unique=True, help_text="Hash da tag RFID")
	slot_x = models.PositiveSmallIntegerField()
	slot_y = models.PositiveSmallIntegerField()
	slot_ocupado = models.BooleanField(default=True)
	descricao = models.CharField(max_length=255, blank=True)
	status = models.CharField(
		max_length=20,
		choices=StatusChoices.choices,
		default=StatusChoices.DISPONIVEL,
		db_index=True,
	)

	def save(self, *args, **kwargs):
		if self.rfid_tag and len(self.rfid_tag) != 64:
			self.rfid_tag = hash_rfid(self.rfid_tag)
		super().save(*args, **kwargs)

	def __str__(self):
		return f"Chave {self.numero} - {self.sala} [{self.get_status_display()}]"

	class Meta:
		verbose_name = "Chave"
		verbose_name_plural = "Chaves"
		unique_together = [("sala", "numero")]
