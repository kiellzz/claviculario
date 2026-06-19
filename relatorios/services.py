from django.db.models import Count

from chaves.models import Chave
from eventos.models import Evento
from operacoes.models import Emprestimo


def obter_status_chaves():
	return Chave.objects.select_related("sala").order_by("sala__codigo", "numero")


def obter_eventos_recentes(limite=50):
	return Evento.objects.select_related("usuario", "chave", "sala")[:limite]


def obter_chaves_emprestadas():
	return Emprestimo.objects.filter(devolvido_em__isnull=True).select_related("usuario", "chave")


def obter_chaves_em_atraso():
	return Emprestimo.objects.filter(
		devolvido_em__isnull=True,
		atraso_registrado=True,
	).select_related("usuario", "chave")


def historico_por_usuario(usuario):
	return Evento.objects.filter(usuario=usuario).select_related("chave", "sala")


def historico_por_chave(chave):
	return Evento.objects.filter(chave=chave).select_related("usuario", "sala")


def retiradas_por_periodo(inicio, fim):
	query = Evento.objects.filter(tipo="retirada")
	if inicio and fim:
		query = query.filter(timestamp__range=(inicio, fim))
	return query


def uso_por_sala(inicio=None, fim=None):
	query = Evento.objects.filter(tipo="retirada")
	if inicio and fim:
		query = query.filter(timestamp__range=(inicio, fim))
	return query.values("sala__codigo").annotate(total=Count("id")).order_by("-total")
