from rest_framework.response import Response
from rest_framework.views import APIView

from core.permissions import IsCoordenacao, IsPorteiroOrCoordenacao
from eventos.serializers import EventoSerializer
from operacoes.serializers import EmprestimoSerializer

from .services import (
	historico_por_chave,
	historico_por_usuario,
	obter_chaves_em_atraso,
	obter_chaves_emprestadas,
	obter_eventos_recentes,
	obter_status_chaves,
	retiradas_por_periodo,
	uso_por_sala,
)


class StatusChavesAPIView(APIView):
	permission_classes = [IsPorteiroOrCoordenacao]

	def get(self, request):
		dados = [
			{
				"chave_id": chave.id,
				"sala": chave.sala.codigo,
				"numero": chave.numero,
				"status": chave.status,
				"slot_ocupado": chave.slot_ocupado,
			}
			for chave in obter_status_chaves()
		]
		return Response(dados)


class EventosRecentesAPIView(APIView):
	permission_classes = [IsPorteiroOrCoordenacao]

	def get(self, request):
		limite = int(request.query_params.get("limite", 50))
		return Response(EventoSerializer(obter_eventos_recentes(limite), many=True).data)


class ChavesEmprestadasAPIView(APIView):
	permission_classes = [IsPorteiroOrCoordenacao]

	def get(self, request):
		return Response(EmprestimoSerializer(obter_chaves_emprestadas(), many=True).data)


class ChavesEmAtrasoAPIView(APIView):
	permission_classes = [IsPorteiroOrCoordenacao]

	def get(self, request):
		return Response(EmprestimoSerializer(obter_chaves_em_atraso(), many=True).data)


class HistoricoUsuarioAPIView(APIView):
	permission_classes = [IsCoordenacao]

	def get(self, request, usuario_id):
		return Response(EventoSerializer(historico_por_usuario(usuario_id), many=True).data)


class HistoricoChaveAPIView(APIView):
	permission_classes = [IsCoordenacao]

	def get(self, request, chave_id):
		return Response(EventoSerializer(historico_por_chave(chave_id), many=True).data)


class RetiradasPorPeriodoAPIView(APIView):
	permission_classes = [IsCoordenacao]

	def get(self, request):
		inicio = request.query_params.get("inicio")
		fim = request.query_params.get("fim")
		return Response(EventoSerializer(retiradas_por_periodo(inicio, fim), many=True).data)


class UsoPorSalaAPIView(APIView):
	permission_classes = [IsCoordenacao]

	def get(self, request):
		return Response(list(uso_por_sala()))
