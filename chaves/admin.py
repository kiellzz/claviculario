from django.contrib import admin

from .models import Chave


@admin.register(Chave)
class ChaveAdmin(admin.ModelAdmin):
	list_display = ("numero", "sala", "status", "slot_x", "slot_y", "slot_ocupado")
	list_filter = ("status", "slot_ocupado", "sala")
	search_fields = ("numero", "sala__codigo", "rfid_tag")
