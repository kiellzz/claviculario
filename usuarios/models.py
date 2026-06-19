import uuid

from django.contrib.auth.models import AbstractUser
from django.core.validators import RegexValidator
from django.db import models

from shared.security import hash_rfid


class Usuario(AbstractUser):
	id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

	class PapelChoices(models.TextChoices):
		PROFESSOR = "professor", "Professor"
		ALUNO = "aluno", "Aluno"
		PORTEIRO = "porteiro", "Porteiro"
		COORDENACAO = "coordenacao", "Coordenacao"
		FUNCIONARIO = "funcionario", "Funcionario"

	nome = models.CharField(max_length=30, verbose_name="Primeiro Nome")
	sobrenome = models.CharField(max_length=30, verbose_name="Sobrenome")
	matricula = models.CharField(
		max_length=10,
		unique=True,
		validators=[
			RegexValidator(
				regex=r"^\d{10}$",
				message="A matricula deve conter exatamente 10 digitos.",
			)
		],
	)
	email = models.EmailField(
		max_length=50,
		unique=True,
		validators=[
			RegexValidator(
				regex=r"^[\w\.-]+@edu\.pe\.senac\.br$",
				message="Use um email institucional da Faculdade Senac.",
			)
		],
	)
	rfid_tag = models.CharField(max_length=64, unique=True, null=True, blank=True)
	papel = models.CharField(
		max_length=20,
		choices=PapelChoices.choices,
		default=PapelChoices.ALUNO,
		db_index=True,
	)
	ativo = models.BooleanField(default=True, verbose_name="Ativo")
	criado_em = models.DateTimeField(auto_now_add=True)

	class Meta:
		verbose_name = "Usuario"
		verbose_name_plural = "Usuarios"

	def save(self, *args, **kwargs):
		if self.rfid_tag and len(self.rfid_tag) != 64:
			self.rfid_tag = hash_rfid(self.rfid_tag)
		self.first_name = self.nome
		self.last_name = self.sobrenome
		self.is_active = self.ativo
		if not self.username:
			self.username = self.matricula
		super().save(*args, **kwargs)

	def __str__(self):
		return f"{self.nome} {self.sobrenome} ({self.matricula})"


class Aluno(Usuario):
	turma = models.ForeignKey(
		"usuarios.Turma",
		on_delete=models.PROTECT,
		related_name="alunos",
		null=True,
		blank=True,
	)

	class Meta:
		verbose_name = "Aluno"
		verbose_name_plural = "Alunos"


class Turma(models.Model):
	id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
	codigo = models.CharField(max_length=20, unique=True)
	descricao = models.CharField(max_length=100, blank=True)
	ativa = models.BooleanField(default=True)

	def __str__(self):
		return self.codigo


class Professor(Usuario):
	materias = models.CharField(max_length=100, verbose_name="Materia")

	class Meta:
		verbose_name = "Professor"
		verbose_name_plural = "Professores"


class Coordenador(Usuario):
	curso = models.CharField(max_length=100, verbose_name="Curso")

	class Meta:
		verbose_name = "Coordenador"
		verbose_name_plural = "Coordenadores"


class Funcionario(Usuario):
	class FuncaoChoices(models.TextChoices):
		ZELADORIA = "zelador", "Zeladoria"
		MANUTENCAO = "manutencao", "Manutencao"
		SECRETARIA = "secretaria", "Secretaria"
		PORTEIRO = "porteiro", "Porteiro"

	funcao = models.CharField(max_length=20, choices=FuncaoChoices.choices)

	class Meta:
		verbose_name = "Funcionario"
		verbose_name_plural = "Funcionarios"

	def save(self, *args, **kwargs):
		self.papel = (
			self.PapelChoices.PORTEIRO
			if self.funcao == self.FuncaoChoices.PORTEIRO
			else self.PapelChoices.FUNCIONARIO
		)
		super().save(*args, **kwargs)