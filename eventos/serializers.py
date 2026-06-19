from rest_framework import serializers

from .models import Evento


class EventoSerializer(serializers.ModelSerializer):
	usuario_nome = serializers.SerializerMethodField()
	chave_numero = serializers.CharField(source="chave.numero", read_only=True)
	sala_codigo = serializers.CharField(source="sala.codigo", read_only=True)

	def get_usuario_nome(self, obj):
		if obj.usuario is None:
			return None
		return f"{obj.usuario.nome} {obj.usuario.sobrenome}".strip()

	class Meta:
		model = Evento
		fields = [
			"id",
			"tipo",
			"usuario",
			"usuario_nome",
			"chave",
			"chave_numero",
			"sala",
			"sala_codigo",
			"timestamp",
			"detalhes",
		]
		read_only_fields = fields
