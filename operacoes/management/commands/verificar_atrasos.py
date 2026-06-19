from django.core.management.base import BaseCommand

from operacoes.services import verificar_chaves_em_atraso


class Command(BaseCommand):
	help = "Registra eventos de atraso para emprestimos vencidos."

	def handle(self, *args, **options):
		atrasados = verificar_chaves_em_atraso()
		self.stdout.write(self.style.SUCCESS(f"Atrasos registrados: {len(atrasados)}"))
