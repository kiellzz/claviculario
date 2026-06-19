from django.shortcuts import render

# Create your views here.
from rest_framework.viewsets import ModelViewSet

from core.permissions import IsCoordenacao, IsPorteiroOrCoordenacao

from .models import Sala
from .serializers import SalaSerializer


class SalaViewSet(ModelViewSet):
	queryset = Sala.objects.all().order_by("codigo")
	serializer_class = SalaSerializer
	filterset_fields = ["andar", "tipo_sala"]
	search_fields = ["codigo", "numero", "descricao"]

	def get_permissions(self):
		if self.action in {"list", "retrieve"}:
			return [IsPorteiroOrCoordenacao()]
		return [IsCoordenacao()]
