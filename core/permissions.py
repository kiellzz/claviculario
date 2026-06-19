from rest_framework.permissions import BasePermission


class IsCoordenacao(BasePermission):
	def has_permission(self, request, view):
		return bool(
			request.user
			and request.user.is_authenticated
			and (request.user.is_superuser or request.user.papel == "coordenacao")
		)


class IsPorteiroOrCoordenacao(BasePermission):
	def has_permission(self, request, view):
		return bool(
			request.user
			and request.user.is_authenticated
			and (request.user.is_superuser or request.user.papel in {"porteiro", "coordenacao"})
		)


class IsProfessorAlunoOrCoordenacao(BasePermission):
	def has_permission(self, request, view):
		return bool(
			request.user
			and request.user.is_authenticated
			and (
				request.user.is_superuser
				or request.user.papel in {"professor", "aluno", "coordenacao"}
			)
		)