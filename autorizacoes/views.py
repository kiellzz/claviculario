from django.shortcuts import render

# Create your views here.
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet

from core.permissions import IsCoordenacao
from eventos.models import Evento
from eventos.services import registrar_evento

from .models import Autorizacao
from .serializers import AutorizacaoSerializer


def obter_chave_da_autorizacao(autorizacao):
	if autorizacao.sala_id is None:
		return None
	return autorizacao.sala.chaves.order_by("numero").first()


class AutorizacaoViewSet(ModelViewSet):
	queryset = Autorizacao.objects.select_related("usuario", "sala", "concedida_por").all()
	serializer_class = AutorizacaoSerializer
	permission_classes = [IsCoordenacao]
	filterset_fields = ["ativa", "sala", "usuario"]
	search_fields = ["usuario__matricula", "usuario__nome", "motivo"]

	def perform_create(self, serializer):
		autorizacao = serializer.save()
		registrar_evento(
			Evento.TipoChoices.AUTORIZACAO,
			usuario=autorizacao.usuario,
			chave=obter_chave_da_autorizacao(autorizacao),
			sala=autorizacao.sala,
			detalhes={
				"acao": "criada",
				"autorizacao_id": str(autorizacao.id),
				"concedida_por": str(autorizacao.concedida_por_id),
				"valida_de": autorizacao.valida_de.isoformat(),
				"valida_ate": (
					autorizacao.valida_ate.isoformat()
					if autorizacao.valida_ate
					else None
				),
				"motivo": autorizacao.motivo,
			},
		)

	@action(detail=True, methods=["post"])
	def revogar(self, request, pk=None):
		autorizacao = self.get_object()
		if not autorizacao.ativa:
			return Response(
				{"detail": "Autorizacao ja revogada."},
				status=status.HTTP_400_BAD_REQUEST,
			)
		autorizacao.revogar()
		registrar_evento(
			Evento.TipoChoices.AUTORIZACAO,
			usuario=autorizacao.usuario,
			chave=obter_chave_da_autorizacao(autorizacao),
			sala=autorizacao.sala,
			detalhes={
				"acao": "revogada",
				"autorizacao_id": str(autorizacao.id),
				"revogada_por": str(request.user.id),
				"motivo": autorizacao.motivo,
			},
		)
		return Response(self.get_serializer(autorizacao).data)
