import sys
import os
sys.path.append(os.getcwd())

from generate_audio import generate_audio
from transcribe import transcribe_lecture
from summarization_model import call_summarization_model

test_link = "https://youtu.be/UFDOY1wOOz0?si=Onngf6ktjVOFKLt1"

try:
    print("1. Generating audio...")
    audio_path = generate_audio(test_link)
    print(f"   Audio generated: {audio_path}")

    print("2. Transcribing...")
    text = transcribe_lecture(audio_path)
    print(f"   Transcribed {len(text)} characters.")

    print("3. Summarizing...")
    summary = call_summarization_model(text)
    print("--- SUMMARY ---")
    print(summary)
    print("---------------")

except Exception as e:
    import traceback
    traceback.print_exc()
