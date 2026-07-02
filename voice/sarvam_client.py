import base64
import requests
import config

def is_voice_configured() -> bool:
    """Checks if the Sarvam AI API Key is available."""
    return bool(config.SARVAM_API_KEY)

def transcribe_audio(audio_bytes: bytes, language_code: str = "hi-IN") -> str:
    """
    Transcribe the audio using Sarvam ASR (Speech-To-Text) REST API.
    Sends raw audio bytes as a multipart file form-data upload.
    """
    if not is_voice_configured():
        raise ValueError("Sarvam AI API Key is not set in environment variables.")
        
    url = "https://api.sarvam.ai/speech-to-text"
    headers = {
        "api-subscription-key": config.SARVAM_API_KEY
    }
    
    # Files parameter takes (filename, fileobj, content_type)
    files = {
        "file": ("audio.wav", audio_bytes, "audio/wav")
    }
    
    data = {
        "model": "saaras:v3",
        "language_code": language_code, # Specify spoken language code
        "mode": "transcribe"
    }
    
    try:
        response = requests.post(url, headers=headers, files=files, data=data)
        if response.status_code == 200:
            res_json = response.json()
            # The API returns transcript or transcriptions
            transcript = res_json.get("transcript", "")
            if not transcript and "transcription" in res_json:
                transcript = res_json["transcription"]
            return transcript.strip()
        else:
            print(f"Sarvam ASR error ({response.status_code}): {response.text}")
            raise Exception(f"ASR API error: {response.text}")
    except Exception as e:
        print(f"Failed to transcribe audio via Sarvam: {str(e)}")
        raise e

def synthesize_speech(text: str, language_code: str = "hi-IN") -> bytes:
    """
    Synthesize text into speech using Sarvam TTS (Text-To-Speech) REST API.
    Returns raw audio bytes (wav).
    """
    if not is_voice_configured():
        raise ValueError("Sarvam AI API Key is not set in environment variables.")
        
    url = "https://api.sarvam.ai/text-to-speech"
    headers = {
        "api-subscription-key": config.SARVAM_API_KEY,
        "Content-Type": "application/json"
    }
    
    payload = {
        "text": text,
        "target_language_code": language_code,
        "speaker": config.SARVAM_TTS_SPEAKER,
        "model": "bulbul:v3"
    }
    
    try:
        response = requests.post(url, json=payload, headers=headers)
        if response.status_code == 200:
            res_json = response.json()
            audios = res_json.get("audios", [])
            if audios:
                # The response returns base64 encoded audio strings
                audio_base64 = audios[0]
                return base64.b64decode(audio_base64)
            else:
                raise Exception("No audio returned in response.")
        else:
            print(f"Sarvam TTS error ({response.status_code}): {response.text}")
            raise Exception(f"TTS API error: {response.text}")
    except Exception as e:
        print(f"Failed to synthesize speech via Sarvam: {str(e)}")
        raise e
