import hashlib


def hash_rfid(rfid: str) -> str:
	normalized = (rfid or "").strip()
	if not normalized:
		raise ValueError("RFID nao pode ser vazio.")
	return hashlib.sha256(normalized.encode("utf-8")).hexdigest()
