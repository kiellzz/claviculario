from rest_framework import serializers

from .models import Turma, Usuario


class TurmaSerializer(serializers.ModelSerializer):
	class Meta:
		model = Turma
		fields = ["id", "codigo", "descricao", "ativa"]


class UsuarioSerializer(serializers.ModelSerializer):
	class Meta:
		model = Usuario
		fields = [
			"id",
			"username",
			"nome",
			"sobrenome",
			"matricula",
			"email",
			"rfid_tag",
			"papel",
			"ativo",
			"criado_em",
			"password",
		]
		read_only_fields = ["id", "criado_em"]
		extra_kwargs = {
			"rfid_tag": {"write_only": True, "required": False},
			"password": {"write_only": True, "required": False},
		}

	def create(self, validated_data):
		password = validated_data.pop("password", None)
		usuario = super().create(validated_data)
		if password:
			usuario.set_password(password)
			usuario.save(update_fields=["password"])
		return usuario

	def update(self, instance, validated_data):
		password = validated_data.pop("password", None)
		usuario = super().update(instance, validated_data)
		if password:
			usuario.set_password(password)
			usuario.save(update_fields=["password"])
		return usuario