from django import forms

from .models import Usuario


class UsuarioForm(forms.ModelForm):
	class Meta:
		model = Usuario
		fields = ["nome", "sobrenome", "matricula", "email", "rfid_tag", "papel", "ativo"]