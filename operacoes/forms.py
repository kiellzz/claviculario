from django import forms

from chaves.models import Chave
from usuarios.models import Usuario


class RetiradaForm(forms.Form):
	usuario = forms.ModelChoiceField(queryset=Usuario.objects.filter(ativo=True))
	chave = forms.ModelChoiceField(queryset=Chave.objects.all())


class DevolucaoForm(forms.Form):
	chave = forms.ModelChoiceField(queryset=Chave.objects.all())
