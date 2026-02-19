from pytube import YouTube
import traceback

def test():
    url = "https://www.youtube.com/live/N8svLoC2eNA?si=52NZd-YhJLXd6R4Q"
    try:
        print(f"Testing URL: {url}")
        yt = YouTube(url)
        print("Title:", yt.title)
        audio_stream = yt.streams.filter(only_audio=True).first()
        print("Stream found:", audio_stream)
        # We won't actually download to avoid clutter, just see if it gets the stream
    except Exception:
        print(traceback.format_exc())

if __name__ == "__main__":
    test()
