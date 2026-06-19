from django.contrib import admin

from .models import Devolucao, Emprestimo, Operacao


@admin.register(Operacao)
class OperacaoAdmin(admin.ModelAdmin):
	list_display = ("id", "usuario", "chave")
	search_fields = ("usuario__matricula", "chave__numero", "chave__sala__codigo")


@admin.register(Emprestimo)
class EmprestimoAdmin(admin.ModelAdmin):
	list_display = ("id", "usuario", "chave", "retirado_em", "devolvido_em", "atraso_registrado")
	list_filter = ("devolvido_em", "atraso_registrado")
	search_fields = ("usuario__matricula", "chave__numero", "chave__sala__codigo")
	readonly_fields = ("retirado_em",)


@admin.register(Devolucao)
class DevolucaoAdmin(admin.ModelAdmin):
	list_display = ("id", "emprestimo", "feito_em")
	readonly_fields = ("feito_em",)
