from channels.generic.websocket import AsyncJsonWebsocketConsumer


class EventosConsumer(AsyncJsonWebsocketConsumer):
	async def connect(self):
		await self.channel_layer.group_add("eventos", self.channel_name)
		await self.accept()

	async def disconnect(self, close_code):
		await self.channel_layer.group_discard("eventos", self.channel_name)

	async def evento_sistema(self, event):
		await self.send_json(event["payload"])
