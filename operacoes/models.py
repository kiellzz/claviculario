import uuid

from django.db import models


class Operacao(models.Model):
	id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
	usuario = models.ForeignKey("usuarios.Usuario", on_delete=models.PROTECT)
	chave = models.ForeignKey("chaves.Chave", on_delete=models.PROTECT)

	class Meta:
		abstract = False

	def __str__(self):
		return f"Operacao #{self.pk} - {self.usuario}"


class Emprestimo(Operacao):
	retirado_em = models.DateTimeField(auto_now_add=True)
	devolvido_em = models.DateTimeField(null=True, blank=True)
	limite_devolucao = models.DateTimeField(null=True, blank=True)
	atraso_registrado = models.BooleanField(default=False)

	@property
	def esta_ativo(self):
		return self.devolvido_em is None

	def __str__(self):
		return f"Emprestimo #{self.pk} - Chave: {self.chave}"


class Devolucao(models.Model):
	id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
	feito_em = models.DateTimeField(auto_now_add=True)
	emprestimo = models.OneToOneField(
		Emprestimo, on_delete=models.PROTECT, related_name="devolucao"
	)

	def __str__(self):
		return f"Devolucao do Emprestimo #{self.emprestimo.pk}"
