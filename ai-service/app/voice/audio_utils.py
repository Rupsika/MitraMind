import base64
import io

def validate_audio(audio_bytes: bytes) -> bool:
    """
    Validate that the audio is not empty or extremely small (e.g. empty file).
    """
    if not audio_bytes or len(audio_bytes) < 1000:
        return False
    return True

def audio_to_base64(audio_bytes: bytes) -> str:
    """
    Convert raw audio bytes to a base64 encoded string.
    """
    return base64.b64encode(audio_bytes).decode("utf-8")

def get_audio_html_tag(audio_bytes: bytes, mime_type: str = "audio/wav") -> str:
    """
    Generates an HTML audio tag with base64 embedded audio data for auto-playback in Streamlit.
    """
    b64 = audio_to_base64(audio_bytes)
    return f'<audio autoplay="true" src="data:{mime_type};base64,{b64}">'
