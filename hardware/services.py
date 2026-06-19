from django.conf import settings
from django.core.exceptions import PermissionDenied, ValidationError

from chaves.models import Chave
from operacoes.services import registrar_devolucao, registrar_panico, registrar_retirada
from salas.models import Sala
from shared.security import hash_rfid
from usuarios.models import Usuario


def validar_token_hardware(token):
	if not settings.HARDWARE_TOKEN or token != settings.HARDWARE_TOKEN:
		raise PermissionDenied("Token de hardware invalido.")
	return True


def processar_rfid_usuario(rfid_usuario, codigo_sala):
	usuario = Usuario.objects.filter(rfid_tag=hash_rfid(rfid_usuario)).first()
	if usuario is None:
		raise ValidationError("Usuario inexistente.")
	chave = Chave.objects.select_related("sala").get(sala__codigo=codigo_sala)
	emprestimo = registrar_retirada(usuario, chave)
	return {"emprestimo_id": emprestimo.pk, "chave_id": chave.pk, "slot_x": chave.slot_x, "slot_y": chave.slot_y}


def processar_rfid_chave(rfid_chave):
	chave = Chave.objects.get(rfid_tag=hash_rfid(rfid_chave))
	devolucao = registrar_devolucao(chave)
	return {"devolucao_id": devolucao.pk, "chave_id": chave.pk, "slot_x": chave.slot_x, "slot_y": chave.slot_y}


def processar_panico(codigo_sala, origem="hardware"):
	sala = Sala.objects.get(codigo=codigo_sala)
	evento = registrar_panico(sala, origem=origem)
	return {"evento_id": evento.pk, "sala": sala.codigo, "andar": sala.andar}


def atualizar_status_de_slot(slot_x, slot_y, ocupado):
	chave = Chave.objects.get(slot_x=slot_x, slot_y=slot_y)
	chave.slot_ocupado = ocupado
	chave.save(update_fields=["slot_ocupado"])
	return chave
