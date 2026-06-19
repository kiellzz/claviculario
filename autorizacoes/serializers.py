from rest_framework import serializers

from .models import Autorizacao


class AutorizacaoSerializer(serializers.ModelSerializer):
	vigente = serializers.SerializerMethodField()

	def get_vigente(self, obj):
		return obj.esta_vigente()

	class Meta:
		model = Autorizacao
		fields = [
			"id",
			"usuario",
			"sala",
			"concedida_por",
			"valida_de",
			"valida_ate",
			"ativa",
			"vigente",
			"motivo",
			"criada_em",
		]
		read_only_fields = ["id", "criada_em"]
