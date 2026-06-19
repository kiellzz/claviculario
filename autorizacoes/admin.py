from django.contrib import admin

from .models import Autorizacao


@admin.register(Autorizacao)
class AutorizacaoAdmin(admin.ModelAdmin):
	list_display = ("usuario", "sala", "concedida_por", "ativa", "valida_de", "valida_ate")
	list_filter = ("ativa", "sala")
	search_fields = ("usuario__matricula", "usuario__nome", "concedida_por__matricula")
	readonly_fields = ("criada_em",)
