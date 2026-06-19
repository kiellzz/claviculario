from django import forms

from .models import Sala


class SalaForm(forms.ModelForm):
	class Meta:
		model = Sala
		fields = ["codigo", "andar", "numero", "descricao", "tipo_sala"]
