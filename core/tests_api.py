from datetime import timedelta

from django.test import TestCase
from django.urls import reverse
from django.utils import timezone
from rest_framework.test import APIClient

from chaves.models import Chave
from autorizacoes.models import Autorizacao
from eventos.models import Evento
from salas.models import Sala
from usuarios.models import Usuario


class ApiBackendTests(TestCase):
	def setUp(self):
		self.client = APIClient()
		self.coordenador = Usuario.objects.create_user(
			username="coord",
			password="senha-forte",
			nome="Coord",
			sobrenome="Teste",
			matricula="1000000001",
			email="coord@edu.pe.senac.br",
			papel="coordenacao",
		)
		self.porteiro = Usuario.objects.create_user(
			username="port",
			password="senha-forte",
			nome="Port",
			sobrenome="Teste",
			matricula="1000000002",
			email="port@edu.pe.senac.br",
			papel="porteiro",
		)
		self.professor = Usuario.objects.create_user(
			username="profapi",
			password="senha-forte",
			nome="Prof",
			sobrenome="Teste",
			matricula="1000000003",
			email="profapi@edu.pe.senac.br",
			papel="professor",
		)
		self.sala = Sala.objects.create(codigo="401A", andar=4, numero="01A")
		self.chave = Chave.objects.create(
			sala=self.sala,
			numero="0002",
			rfid_tag="api-chave",
			slot_x=3,
			slot_y=4,
		)

	def autenticar(self, usuario):
		self.client.force_authenticate(user=usuario)

	def test_jwt_login(self):
		resposta = self.client.post(
			"/api/auth/token/",
			{"username": "coord", "password": "senha-forte"},
			format="json",
		)
		self.assertEqual(resposta.status_code, 200)
		self.assertIn("access", resposta.data)

	def test_permissao_porteiro_nao_cria_usuario(self):
		self.autenticar(self.porteiro)
		resposta = self.client.post(
			"/api/usuarios/",
			{
				"username": "novo",
				"nome": "Novo",
				"sobrenome": "Teste",
				"matricula": "1000000004",
				"email": "novo@edu.pe.senac.br",
				"papel": "aluno",
			},
			format="json",
		)
		self.assertEqual(resposta.status_code, 403)

	def test_porteiro_acessa_apenas_proprio_perfil(self):
		self.autenticar(self.porteiro)
		perfil = self.client.get("/api/usuarios/me/")
		lista = self.client.get("/api/usuarios/")
		self.assertEqual(perfil.status_code, 200)
		self.assertEqual(perfil.data["id"], str(self.porteiro.id))
		self.assertEqual(lista.status_code, 403)

	def test_porteiro_visualiza_mas_nao_altera_salas(self):
		self.autenticar(self.porteiro)
		lista = self.client.get("/api/salas/")
		alteracao = self.client.patch(
			f"/api/salas/{self.sala.id}/",
			{"descricao": "Alterada pela portaria"},
			format="json",
		)
		self.assertEqual(lista.status_code, 200)
		self.assertEqual(alteracao.status_code, 403)

	def test_relatorio_status_chaves_para_porteiro(self):
		self.autenticar(self.porteiro)
		resposta = self.client.get("/api/relatorios/status-chaves/")
		self.assertEqual(resposta.status_code, 200)
		self.assertEqual(resposta.data[0]["sala"], self.sala.codigo)

	def test_importacao_timetable_por_api(self):
		self.autenticar(self.coordenador)
		agora = timezone.now()
		resposta = self.client.post(
			"/api/timetable/importar/",
			[
				{
					"professor_matricula": self.professor.matricula,
					"sala_codigo": self.sala.codigo,
					"dia_semana": agora.weekday(),
					"hora_inicio": "08:00",
					"hora_fim": "10:00",
					"vigencia_inicio": str(agora.date()),
					"vigencia_fim": str((agora + timedelta(days=30)).date()),
				}
			],
			format="json",
		)
		self.assertEqual(resposta.status_code, 200)
		self.assertEqual(resposta.data["importados"], 1)

	def test_autorizacao_gera_log_e_revogacao_preserva_historico(self):
		self.autenticar(self.coordenador)
		agora = timezone.now()
		criacao = self.client.post(
			"/api/autorizacoes/",
			{
				"usuario": str(self.professor.id),
				"sala": str(self.sala.id),
				"concedida_por": str(self.coordenador.id),
				"valida_de": agora.isoformat(),
				"valida_ate": (agora + timedelta(hours=2)).isoformat(),
				"ativa": True,
				"motivo": "Acesso fora do horario",
			},
			format="json",
		)
		self.assertEqual(criacao.status_code, 201)
		autorizacao_id = criacao.data["id"]
		evento_criacao = Evento.objects.filter(
				tipo="autorizacao",
				detalhes__acao="criada",
				detalhes__autorizacao_id=str(autorizacao_id),
			).get()
		self.assertEqual(evento_criacao.chave, self.chave)

		revogacao = self.client.post(f"/api/autorizacoes/{autorizacao_id}/revogar/")
		self.assertEqual(revogacao.status_code, 200)
		self.assertFalse(Autorizacao.objects.get(id=autorizacao_id).ativa)
		self.assertTrue(
			Evento.objects.filter(
				tipo="autorizacao",
				detalhes__acao="revogada",
				detalhes__autorizacao_id=str(autorizacao_id),
			).exists()
		)

	def test_porteiro_nao_revoga_autorizacao(self):
		autorizacao = Autorizacao.objects.create(
			usuario=self.professor,
			sala=self.sala,
			concedida_por=self.coordenador,
			valida_ate=timezone.now() + timedelta(hours=1),
			motivo="Teste de permissao",
		)
		self.autenticar(self.porteiro)
		resposta = self.client.post(
			f"/api/autorizacoes/{autorizacao.id}/revogar/"
		)
		self.assertEqual(resposta.status_code, 403)
		autorizacao.refresh_from_db()
		self.assertTrue(autorizacao.ativa)

	def test_autorizacao_expirada_nao_e_vigente(self):
		agora = timezone.now()
		autorizacao = Autorizacao.objects.create(
			usuario=self.professor,
			sala=self.sala,
			concedida_por=self.coordenador,
			valida_de=agora - timedelta(hours=2),
			valida_ate=agora - timedelta(hours=1),
			motivo="Autorizacao expirada",
		)
		self.autenticar(self.coordenador)
		resposta = self.client.get(f"/api/autorizacoes/{autorizacao.id}/")
		self.assertEqual(resposta.status_code, 200)
		self.assertTrue(resposta.data["ativa"])
		self.assertFalse(resposta.data["vigente"])
