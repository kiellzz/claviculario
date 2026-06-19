from rest_framework import serializers

from .models import Devolucao, Emprestimo


class EmprestimoSerializer(serializers.ModelSerializer):
	usuario_nome = serializers.SerializerMethodField()
	chave_numero = serializers.CharField(source="chave.numero", read_only=True)
	sala_codigo = serializers.CharField(source="chave.sala.codigo", read_only=True)

	def get_usuario_nome(self, obj):
		return f"{obj.usuario.nome} {obj.usuario.sobrenome}".strip()

	class Meta:
		model = Emprestimo
		fields = [
			"id",
			"usuario",
			"chave",
			"retirado_em",
			"devolvido_em",
			"limite_devolucao",
			"atraso_registrado",
			"usuario_nome",
			"chave_numero",
			"sala_codigo",
		]
		read_only_fields = fields


class DevolucaoSerializer(serializers.ModelSerializer):
	class Meta:
		model = Devolucao
		fields = ["id", "feito_em", "emprestimo"]
		read_only_fields = fields


class RetiradaSerializer(serializers.Serializer):
	rfid_usuario = serializers.CharField(required=False)
	usuario_id = serializers.UUIDField(required=False)
	codigo_sala = serializers.CharField(required=False)
	chave_id = serializers.UUIDField(required=False)


class DevolucaoInputSerializer(serializers.Serializer):
	rfid_chave = serializers.CharField(required=False)
	chave_id = serializers.UUIDField(required=False)


class PanicoInputSerializer(serializers.Serializer):
	codigo_sala = serializers.CharField()
	origem = serializers.CharField(default="api")
