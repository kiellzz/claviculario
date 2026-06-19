from .models import Evento
from .realtime import publicar_evento


def registrar_evento(tipo, usuario=None, chave=None, sala=None, detalhes=None):
	evento = Evento.objects.create(
		tipo=tipo,
		usuario=usuario,
		chave=chave,
		sala=sala,
		detalhes=detalhes or {},
	)
	publicar_evento(evento)
	return evento
