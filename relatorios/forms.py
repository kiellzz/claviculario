from django import forms

from salas.models import Sala
from usuarios.models import Usuario


class FiltroRelatorioForm(forms.Form):
	inicio = forms.DateTimeField(required=False)
	fim = forms.DateTimeField(required=False)
	sala = forms.ModelChoiceField(queryset=Sala.objects.all(), required=False)
	usuario = forms.ModelChoiceField(queryset=Usuario.objects.all(), required=False)
