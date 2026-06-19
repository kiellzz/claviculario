from celery import shared_task

from .services import verificar_chaves_em_atraso


@shared_task
def verificar_atrasos_task():
	return len(verificar_chaves_em_atraso())
