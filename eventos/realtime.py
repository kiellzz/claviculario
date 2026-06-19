from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer


def publicar_evento(evento):
	channel_layer = get_channel_layer()
	if channel_layer is None:
		return
	payload = {
		"id": str(evento.id),
		"tipo": evento.tipo,
		"timestamp": evento.timestamp.isoformat(),
		"usuario": str(evento.usuario_id) if evento.usuario_id else None,
		"chave": str(evento.chave_id) if evento.chave_id else None,
		"sala": str(evento.sala_id) if evento.sala_id else None,
		"detalhes": evento.detalhes,
	}
	async_to_sync(channel_layer.group_send)(
		"eventos",
		{"type": "evento.sistema", "payload": payload},
	)
