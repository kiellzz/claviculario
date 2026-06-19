from django.shortcuts import render

# Create your views here.
from rest_framework.viewsets import ModelViewSet

from core.permissions import IsCoordenacao, IsPorteiroOrCoordenacao

from .models import Chave
from .serializers import ChaveSerializer


class ChaveViewSet(ModelViewSet):
	queryset = Chave.objects.select_related("sala").all().order_by("sala__codigo", "numero")
	serializer_class = ChaveSerializer
	filterset_fields = ["status", "slot_ocupado", "sala"]
	search_fields = ["numero", "sala__codigo"]

	def get_permissions(self):
		if self.action in {"list", "retrieve"}:
			return [IsPorteiroOrCoordenacao()]
		return [IsCoordenacao()]