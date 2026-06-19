from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import Turma, Usuario


@admin.register(Usuario)
class UsuarioAdmin(UserAdmin):
	list_display = ("matricula", "nome", "sobrenome", "email", "papel", "ativo")
	list_filter = ("papel", "ativo", "is_staff")
	search_fields = ("matricula", "nome", "sobrenome", "email")
	readonly_fields = ("criado_em", "last_login", "date_joined")
	fieldsets = UserAdmin.fieldsets + (
		("Dados do claviculario", {"fields": ("nome", "sobrenome", "matricula", "rfid_tag", "papel", "ativo", "criado_em")}),
	)
	add_fieldsets = UserAdmin.add_fieldsets + (
		("Dados do claviculario", {"fields": ("nome", "sobrenome", "matricula", "email", "rfid_tag", "papel", "ativo")}),
	)


@admin.register(Turma)
class TurmaAdmin(admin.ModelAdmin):
	list_display = ("codigo", "descricao", "ativa")
	list_filter = ("ativa",)
	search_fields = ("codigo", "descricao")