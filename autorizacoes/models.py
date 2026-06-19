import uuid

from django.core.exceptions import ValidationError
from django.db import models
from django.utils import timezone


class Autorizacao(models.Model):
	id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

	usuario = models.ForeignKey(
		"usuarios.Usuario", on_delete=models.CASCADE, related_name="autorizacoes"
	)
	sala = models.ForeignKey(
		"salas.Sala",
		on_delete=models.CASCADE,
		related_name="autorizacoes",
		null=True,
		blank=True,
	)
	concedida_por = models.ForeignKey(
		"usuarios.Usuario",
		on_delete=models.PROTECT,
		related_name="autorizacoes_concedidas",
	)
	valida_de = models.DateTimeField(default=timezone.now)
	valida_ate = models.DateTimeField(null=True, blank=True)
	ativa = models.BooleanField(default=True, db_index=True)
	motivo = models.TextField(blank=True)
	criada_em = models.DateTimeField(auto_now_add=True)

	def esta_vigente(self, agora=None) -> bool:
		agora = agora or timezone.now()
		if not self.ativa or agora < self.valida_de:
			return False
		return self.valida_ate is None or agora <= self.valida_ate

	def clean(self):
		if self.valida_ate and self.valida_ate <= self.valida_de:
			raise ValidationError("A validade final deve ser posterior ao inicio.")
		if self.concedida_por and self.concedida_por.papel != "coordenacao":
			raise ValidationError("Autorizacao deve ser concedida pela coordenacao.")

	def revogar(self):
		self.ativa = False
		self.save(update_fields=["ativa"])

	def __str__(self):
		sala = self.sala.codigo if self.sala else "qualquer sala"
		return f"Autorizacao: {self.usuario} -> {sala}"

	class Meta:
		ordering = ["-criada_em"]
		indexes = [
			models.Index(fields=["usuario", "ativa"], name="idx_aut_usuario_ativa"),
		]
