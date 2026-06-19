from django.apps import AppConfig


class OperacoesConfig(AppConfig):
	default_auto_field = "django.db.models.BigAutoField"
	name = "operacoes"

	def ready(self):
		import operacoes.signals  # noqa: F401
