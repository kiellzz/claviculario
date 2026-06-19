from django import forms

from .models import Autorizacao


class AutorizacaoForm(forms.ModelForm):
	class Meta:
		model = Autorizacao
		fields = ["usuario", "sala", "concedida_por", "valida_de", "valida_ate", "ativa", "motivo"]
