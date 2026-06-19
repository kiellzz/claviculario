from django.db.models.signals import post_migrate
from django.dispatch import receiver


@receiver(post_migrate)
def criar_agendamento_verificacao_atrasos(sender, **kwargs):
	if sender.name != "operacoes":
		return
	from django_celery_beat.models import IntervalSchedule, PeriodicTask

	intervalo, _ = IntervalSchedule.objects.get_or_create(
		every=5,
		period=IntervalSchedule.MINUTES,
	)
	PeriodicTask.objects.get_or_create(
		name="Verificar chaves em atraso",
		defaults={
			"interval": intervalo,
			"task": "operacoes.tasks.verificar_atrasos_task",
			"expire_seconds": 600,
		},
	)
