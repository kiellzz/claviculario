import uuid

from django.db import models


class Evento(models.Model):
	id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

	class TipoChoices(models.TextChoices):
		RETIRADA = "retirada", "Retirada"
		DEVOLUCAO = "devolucao", "Devolucao"
		PANICO = "panico", "Panico"
		AUTORIZACAO = "autorizacao", "Autorizacao"
		ATRASO = "atraso", "Atraso"
		STATUS_SLOT = "status_slot", "Status do slot"
		ERRO = "erro", "Erro"
		NEGADO = "negado", "Negado"

	tipo = models.CharField(max_length=20, choices=TipoChoices.choices, db_index=True)
	usuario = models.ForeignKey(
		"usuarios.Usuario",
		on_delete=models.SET_NULL,
		null=True,
		blank=True,
		related_name="eventos",
	)
	chave = models.ForeignKey(
		"chaves.Chave",
		on_delete=models.SET_NULL,
		null=True,
		blank=True,
		related_name="eventos",
	)
	sala = models.ForeignKey(
		"salas.Sala",
		on_delete=models.SET_NULL,
		null=True,
		blank=True,
		related_name="eventos",
	)
	timestamp = models.DateTimeField(auto_now_add=True, db_index=True)
	detalhes = models.JSONField(default=dict, blank=True)

	def __str__(self):
		return f"[{self.get_tipo_display()}] {self.timestamp:%d/%m/%Y %H:%M}"

	class Meta:
		ordering = ["-timestamp"]
		indexes = [
			models.Index(fields=["timestamp"], name="idx_evento_timestamp"),
			models.Index(fields=["chave", "timestamp"], name="idx_evento_chave_time"),
			models.Index(fields=["usuario", "timestamp"], name="idx_evento_usuario_time"),
		]
