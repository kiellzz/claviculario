from rest_framework import serializers

from .models import Chave


class ChaveSerializer(serializers.ModelSerializer):
	class Meta:
		model = Chave
		fields = [
			"id",
			"sala",
			"numero",
			"rfid_tag",
			"slot_x",
			"slot_y",
			"slot_ocupado",
			"descricao",
			"status",
		]
		read_only_fields = ["id"]
		extra_kwargs = {"rfid_tag": {"write_only": True, "required": False}}