from datetime import timedelta

from django.core.exceptions import PermissionDenied, ValidationError
from django.db import transaction
from django.utils import timezone

from autorizacoes.services import possui_autorizacao_ativa
from chaves.models import Chave
from eventos.models import Evento
from eventos.services import registrar_evento
from timetable.models import Timetable
from timetable.services import professor_esta_no_horario

from .models import Devolucao, Emprestimo


def _limite_por_timetable(usuario, sala, agora):
	entrada = Timetable.objects.filter(
		professor=usuario,
		sala=sala,
		dia_semana=agora.weekday(),
		hora_inicio__lte=agora.time(),
		hora_fim__gte=agora.time(),
		vigencia_inicio__lte=agora.date(),
	).filter(vigencia_fim__isnull=True).first()
	if entrada is None:
		entrada = Timetable.objects.filter(
			professor=usuario,
			sala=sala,
			dia_semana=agora.weekday(),
			hora_inicio__lte=agora.time(),
			hora_fim__gte=agora.time(),
			vigencia_inicio__lte=agora.date(),
			vigencia_fim__gte=agora.date(),
		).first()
	if entrada is None:
		return None
	return timezone.make_aware(timezone.datetime.combine(agora.date(), entrada.hora_fim))


def verificar_autorizacao(usuario, chave, agora=None):
	agora = agora or timezone.now()
	if usuario is None:
		return False, "Usuario inexistente", None
	if not usuario.ativo:
		return False, "Usuario inativo", None
	if chave.status == Chave.StatusChoices.EMPRESTADA:
		return False, "Chave ja emprestada", None
	if usuario.papel == "porteiro":
		return False, "Porteiro nao pode retirar chave", None
	if usuario.papel == "coordenacao":
		return True, "Coordenacao autorizada", None

	autorizacao = possui_autorizacao_ativa(usuario, chave.sala, agora)
	if autorizacao:
		return True, "Autorizacao ativa", autorizacao.valida_ate

	if usuario.papel == "professor" and professor_esta_no_horario(usuario, chave.sala, agora):
		return True, "Professor dentro do horario", _limite_por_timetable(
			usuario, chave.sala, agora
		)
	if usuario.papel == "aluno":
		return False, "Aluno sem autorização ativa", None
	return False, "Sem autorização para retirar esta chave", None


def registrar_retirada(usuario, chave, agora=None):
	agora = agora or timezone.now()
	autorizado, motivo, limite = verificar_autorizacao(usuario, chave, agora)
	if not autorizado:
		registrar_evento(
			Evento.TipoChoices.NEGADO,
			usuario=usuario,
			chave=chave,
			sala=chave.sala,
			detalhes={"motivo": motivo},
		)
		raise PermissionDenied(motivo)
	with transaction.atomic():
		chave = Chave.objects.select_for_update().get(pk=chave.pk)
		if chave.status == Chave.StatusChoices.EMPRESTADA:
			registrar_evento(
				Evento.TipoChoices.NEGADO,
				usuario=usuario,
				chave=chave,
				sala=chave.sala,
				detalhes={"motivo": "Chave ja emprestada"},
			)
			raise PermissionDenied("Chave ja emprestada")
		chave.status = Chave.StatusChoices.EMPRESTADA
		chave.slot_ocupado = False
		chave.save(update_fields=["status", "slot_ocupado"])
		emprestimo = Emprestimo.objects.create(
			usuario=usuario,
			chave=chave,
			limite_devolucao=limite,
		)
	registrar_evento(Evento.TipoChoices.RETIRADA, usuario, chave, chave.sala, {"motivo": motivo})
	return emprestimo


@transaction.atomic
def registrar_devolucao(chave, agora=None):
	agora = agora or timezone.now()
	chave = Chave.objects.select_for_update().get(pk=chave.pk)
	emprestimo = (
		Emprestimo.objects.select_for_update()
		.filter(chave=chave, devolvido_em__isnull=True)
		.order_by("-retirado_em")
		.first()
	)
	if emprestimo is None:
		registrar_evento(
			Evento.TipoChoices.NEGADO,
			chave=chave,
			sala=chave.sala,
			detalhes={"motivo": "Sem emprestimo ativo"},
		)
		raise ValidationError("Nao existe emprestimo ativo para esta chave.")
	emprestimo.devolvido_em = agora
	emprestimo.save(update_fields=["devolvido_em"])
	chave.status = Chave.StatusChoices.DISPONIVEL
	chave.slot_ocupado = True
	chave.save(update_fields=["status", "slot_ocupado"])
	devolucao = Devolucao.objects.create(emprestimo=emprestimo)
	registrar_evento(
		Evento.TipoChoices.DEVOLUCAO,
		emprestimo.usuario,
		chave,
		chave.sala,
		{"emprestimo_id": str(emprestimo.pk)},
	)
	return devolucao


def registrar_panico(sala, origem="hardware", detalhes=None):
	payload = {"origem": origem, "andar": sala.andar, "sala": sala.codigo}
	payload.update(detalhes or {})
	return registrar_evento(Evento.TipoChoices.PANICO, sala=sala, detalhes=payload)


def verificar_chaves_em_atraso(agora=None):
	agora = agora or timezone.now()
	atrasados = []
	limite_padrao = agora - timedelta(minutes=30)
	for emprestimo in Emprestimo.objects.filter(
		devolvido_em__isnull=True,
		atraso_registrado=False,
	):
		limite = emprestimo.limite_devolucao
		if limite is None:
			limite = emprestimo.retirado_em
		if limite + timedelta(minutes=30) <= agora or emprestimo.retirado_em <= limite_padrao:
			registrar_evento(
				Evento.TipoChoices.ATRASO,
				emprestimo.usuario,
				emprestimo.chave,
				emprestimo.chave.sala,
				{"emprestimo_id": str(emprestimo.pk), "limite_devolucao": limite.isoformat()},
			)
			emprestimo.atraso_registrado = True
			emprestimo.save(update_fields=["atraso_registrado"])
			atrasados.append(emprestimo)
	return atrasados
