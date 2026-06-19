from django.shortcuts import render

from rest_framework.viewsets import ModelViewSet
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from core.permissions import IsCoordenacao

from .models import Turma, Usuario
from .serializers import TurmaSerializer, UsuarioSerializer


class UsuarioViewSet(ModelViewSet):
	queryset = Usuario.objects.all().order_by("matricula")
	serializer_class = UsuarioSerializer
	permission_classes = [IsCoordenacao]
	filterset_fields = ["papel", "ativo"]
	search_fields = ["matricula", "nome", "sobrenome", "email"]

	def get_permissions(self):
		if self.action == "me":
			return [IsAuthenticated()]
		return [IsCoordenacao()]

	@action(detail=False, methods=["get"])
	def me(self, request):
		return Response(self.get_serializer(request.user).data)


class TurmaViewSet(ModelViewSet):
	queryset = Turma.objects.all().order_by("codigo")
	serializer_class = TurmaSerializer
	permission_classes = [IsCoordenacao]
	filterset_fields = ["ativa"]
	search_fields = ["codigo", "descricao"]
