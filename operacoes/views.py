from django.core.exceptions import PermissionDenied, ValidationError
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.viewsets import ReadOnlyModelViewSet

from chaves.models import Chave
from core.permissions import IsCoordenacao, IsProfessorAlunoOrCoordenacao
from salas.models import Sala
from shared.security import hash_rfid
from usuarios.models import Usuario

from .models import Emprestimo
from .serializers import (
	DevolucaoInputSerializer,
	EmprestimoSerializer,
	PanicoInputSerializer,
	RetiradaSerializer,
)
from .services import registrar_devolucao, registrar_panico, registrar_retirada


class EmprestimoViewSet(ReadOnlyModelViewSet):
	queryset = Emprestimo.objects.select_related("usuario", "chave", "chave__sala").all()
	serializer_class = EmprestimoSerializer
	permission_classes = [IsCoordenacao]
	filterset_fields = ["usuario", "chave", "devolvido_em", "atraso_registrado"]


class RetiradaAPIView(APIView):
	permission_classes = [IsProfessorAlunoOrCoordenacao]

	def post(self, request):
		serializer = RetiradaSerializer(data=request.data)
		serializer.is_valid(raise_exception=True)
		data = serializer.validated_data
		usuario = request.user
		if data.get("usuario_id") and request.user.papel == "coordenacao":
			usuario = Usuario.objects.get(pk=data["usuario_id"])
		if data.get("rfid_usuario"):
			usuario = Usuario.objects.get(rfid_tag=hash_rfid(data["rfid_usuario"]))
		if data.get("chave_id"):
			chave = Chave.objects.get(pk=data["chave_id"])
		else:
			chave = Chave.objects.get(sala__codigo=data["codigo_sala"])
		try:
			emprestimo = registrar_retirada(usuario, chave)
		except PermissionDenied as exc:
			return Response({"autorizado": False, "mensagem": str(exc)}, status=status.HTTP_403_FORBIDDEN)
		return Response(
			{
				"autorizado": True,
				"emprestimo_id": emprestimo.pk,
				"chave_id": chave.pk,
				"slot_x": chave.slot_x,
				"slot_y": chave.slot_y,
				"mensagem": "Chave liberada.",
			}
		)


class DevolucaoAPIView(APIView):
	permission_classes = [IsProfessorAlunoOrCoordenacao]

	def post(self, request):
		serializer = DevolucaoInputSerializer(data=request.data)
		serializer.is_valid(raise_exception=True)
		data = serializer.validated_data
		chave = (
			Chave.objects.get(pk=data["chave_id"])
			if data.get("chave_id")
			else Chave.objects.get(rfid_tag=hash_rfid(data["rfid_chave"]))
		)
		try:
			devolucao = registrar_devolucao(chave)
		except ValidationError as exc:
			return Response({"ok": False, "mensagem": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
		return Response({"ok": True, "devolucao_id": devolucao.pk, "chave_id": chave.pk})


class PanicoAPIView(APIView):
	permission_classes = [IsProfessorAlunoOrCoordenacao]

	def post(self, request):
		serializer = PanicoInputSerializer(data=request.data)
		serializer.is_valid(raise_exception=True)
		sala = Sala.objects.get(codigo=serializer.validated_data["codigo_sala"])
		evento = registrar_panico(sala, origem=serializer.validated_data["origem"])
		return Response({"ok": True, "evento_id": evento.pk})