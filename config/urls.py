from django.contrib import admin
from django.urls import include, path
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from autorizacoes.views import AutorizacaoViewSet
from chaves.views import ChaveViewSet
from core.views import painel, teste_backend
from eventos.views import EventoViewSet
from hardware import views as hardware_views
from operacoes.views import (
	DevolucaoAPIView,
	EmprestimoViewSet,
	PanicoAPIView,
	RetiradaAPIView,
)
from relatorios.views import (
	ChavesEmAtrasoAPIView,
	ChavesEmprestadasAPIView,
	EventosRecentesAPIView,
	HistoricoChaveAPIView,
	HistoricoUsuarioAPIView,
	RetiradasPorPeriodoAPIView,
	StatusChavesAPIView,
	UsoPorSalaAPIView,
)
from salas.views import SalaViewSet
from timetable.views import TimetableViewSet
from usuarios.views import TurmaViewSet, UsuarioViewSet

router = DefaultRouter()
router.register("usuarios", UsuarioViewSet)
router.register("turmas", TurmaViewSet)
router.register("salas", SalaViewSet)
router.register("chaves", ChaveViewSet)
router.register("autorizacoes", AutorizacaoViewSet)
router.register("eventos", EventoViewSet)
router.register("emprestimos", EmprestimoViewSet)
router.register("timetable", TimetableViewSet)

urlpatterns = [
	path("", painel, name="painel-home"),
	path("painel/", painel, name="painel"),
	path("teste/", teste_backend, name="teste-backend"),
	path("admin/", admin.site.urls),
	path("api/auth/token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
	path("api/auth/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
	path("api/", include(router.urls)),
	path("api/operacoes/retirada/", RetiradaAPIView.as_view(), name="operacao-retirada"),
	path("api/operacoes/devolucao/", DevolucaoAPIView.as_view(), name="operacao-devolucao"),
	path("api/operacoes/panico/", PanicoAPIView.as_view(), name="operacao-panico"),
	path("api/relatorios/status-chaves/", StatusChavesAPIView.as_view(), name="relatorio-status-chaves"),
	path("api/relatorios/eventos-recentes/", EventosRecentesAPIView.as_view(), name="relatorio-eventos-recentes"),
	path("api/relatorios/chaves-emprestadas/", ChavesEmprestadasAPIView.as_view(), name="relatorio-chaves-emprestadas"),
	path("api/relatorios/chaves-em-atraso/", ChavesEmAtrasoAPIView.as_view(), name="relatorio-chaves-atraso"),
	path("api/relatorios/usuarios/<uuid:usuario_id>/historico/", HistoricoUsuarioAPIView.as_view(), name="relatorio-historico-usuario"),
	path("api/relatorios/chaves/<uuid:chave_id>/historico/", HistoricoChaveAPIView.as_view(), name="relatorio-historico-chave"),
	path("api/relatorios/retiradas/", RetiradasPorPeriodoAPIView.as_view(), name="relatorio-retiradas"),
	path("api/relatorios/uso-por-sala/", UsoPorSalaAPIView.as_view(), name="relatorio-uso-sala"),
	path("api/hardware/rfid-usuario/", hardware_views.rfid_usuario, name="hardware-rfid-usuario"),
	path("api/hardware/rfid-chave/", hardware_views.rfid_chave, name="hardware-rfid-chave"),
	path("api/hardware/panico/", hardware_views.panico, name="hardware-panico"),
	path("api/hardware/status-slot/", hardware_views.status_slot, name="hardware-status-slot"),
]