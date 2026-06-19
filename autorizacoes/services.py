from django.db.models import Q
from django.utils import timezone

from .models import Autorizacao


def possui_autorizacao_ativa(usuario, sala=None, agora=None):
	agora = agora or timezone.now()
	query = Autorizacao.objects.filter(
		usuario=usuario,
		ativa=True,
		valida_de__lte=agora,
	).filter(Q(valida_ate__isnull=True) | Q(valida_ate__gte=agora))
	if sala is not None:
		query = query.filter(Q(sala=sala) | Q(sala__isnull=True))
	return query.first()
