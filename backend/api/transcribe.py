import whisper
import os

# Global model to avoid reloading on every request
_whisper_model = None

def transcribe_lecture(audio):
    """Transcribes an audio file into text."""
    global _whisper_model
    if _whisper_model is None:
        print("Loading Whisper 'tiny' model for the first time...")
        _whisper_model = whisper.load_model("tiny")
    
    result = _whisper_model.transcribe(audio)

    # Delete the temporary audio file
    if os.path.exists(audio):
        os.remove(audio)
    
    return result["text"]