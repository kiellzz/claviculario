from rest_framework import serializers

from .models import Sala


class SalaSerializer(serializers.ModelSerializer):
	class Meta:
		model = Sala
		fields = ["id", "codigo", "andar", "numero", "descricao", "tipo_sala"]
		read_only_fields = ["id"]