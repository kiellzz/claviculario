from django import forms

from .models import Chave


class ChaveForm(forms.ModelForm):
	class Meta:
		model = Chave
		fields = [
			"sala",
			"numero",
			"rfid_tag",
			"slot_x",
			"slot_y",
			"slot_ocupado",
			"descricao",
			"status",
		]
