import json

from django.core.exceptions import PermissionDenied, ValidationError
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST

from .services import (
	atualizar_status_de_slot,
	processar_panico,
	processar_rfid_chave,
	processar_rfid_usuario,
	validar_token_hardware,
)


def _payload(request):
	if not request.body:
		return {}
	return json.loads(request.body.decode("utf-8"))


def _responder(fn, request):
	try:
		validar_token_hardware(request.headers.get("X-HARDWARE-TOKEN"))
		return JsonResponse({"ok": True, "dados": fn(_payload(request))})
	except PermissionDenied as exc:
		return JsonResponse({"ok": False, "erro": str(exc)}, status=403)
	except (ValidationError, ValueError, KeyError, json.JSONDecodeError) as exc:
		return JsonResponse({"ok": False, "erro": str(exc)}, status=400)
	except Exception as exc:
		return JsonResponse({"ok": False, "erro": str(exc)}, status=500)


@csrf_exempt
@require_POST
def rfid_usuario(request):
	return _responder(
		lambda data: processar_rfid_usuario(data["rfid_usuario"], data["codigo_sala"]),
		request,
	)


@csrf_exempt
@require_POST
def rfid_chave(request):
	return _responder(lambda data: processar_rfid_chave(data["rfid_chave"]), request)


@csrf_exempt
@require_POST
def panico(request):
	return _responder(
		lambda data: processar_panico(data["codigo_sala"], data.get("origem", "hardware")),
		request,
	)


@csrf_exempt
@require_POST
def status_slot(request):
	def handler(data):
		chave = atualizar_status_de_slot(data["slot_x"], data["slot_y"], data["ocupado"])
		return {"chave_id": chave.pk, "slot_ocupado": chave.slot_ocupado}

	return _responder(handler, request)
