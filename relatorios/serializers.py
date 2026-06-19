from rest_framework import serializers


class FiltroPeriodoSerializer(serializers.Serializer):
	inicio = serializers.DateTimeField(required=False)
	fim = serializers.DateTimeField(required=False)
	sala = serializers.UUIDField(required=False)
	usuario = serializers.UUIDField(required=False)