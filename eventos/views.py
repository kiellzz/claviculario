from django.shortcuts import render

# Create your views here.
from rest_framework.viewsets import ReadOnlyModelViewSet

from core.permissions import IsPorteiroOrCoordenacao

from .models import Evento
from .serializers import EventoSerializer


class EventoViewSet(ReadOnlyModelViewSet):
	queryset = Evento.objects.select_related("usuario", "chave", "sala").all()
	serializer_class = EventoSerializer
	permission_classes = [IsPorteiroOrCoordenacao]
	filterset_fields = ["tipo", "usuario", "chave", "sala"]
	search_fields = ["usuario__matricula", "chave__numero", "sala__codigo"]