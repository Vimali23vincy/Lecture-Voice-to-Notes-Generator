import sys
import os
# Add the current directory to sys.path so we can import our modules
sys.path.append(os.getcwd())

from generate_audio import generate_audio
from transcribe import transcribe_lecture
from summarization_model import call_summarization_model
import traceback

def main():
    url = "https://www.youtube.com/live/N8svLoC2eNA?si=52NZd-YhJLXd6R4Q"
    try:
        print(f"--- Step 1: Downloading Audio from {url} ---")
        audio_path = generate_audio(url)
        print(f"Audio downloaded to: {audio_path}")
        
        print("\n--- Step 2: Transcribing ---")
        transcript = transcribe_lecture(audio_path)
        print(f"Transcript: {transcript[:200]}...")
        
        print("\n--- Step 3: Summarizing ---")
        summary = call_summarization_model(transcript)
        print(f"Summary: {summary}")
        
        print("\nTest partially successful (download works). To test transcription/summarization, uncomment the lines in main().")
        
    except Exception:
        print(traceback.format_exc())

if __name__ == "__main__":
    main()
