import os
import yt_dlp


def generate_audio(video_url):
    """Download audio from given video URL using yt-dlp.
    Parameters:
        - video_url (str): URL of the video to download audio from.
    Returns:
        - temp_audio_file (str): Path to the downloaded audio file."""
    output_path = "audio_download"
    if not os.path.exists(output_path):
        os.makedirs(output_path)
    
    ydl_opts = {
        'format': 'bestaudio/best',
        'outtmpl': os.path.join(output_path, '%(title)s.%(ext)s'),
        'postprocessors': [{
            'key': 'FFmpegExtractAudio',
            'preferredcodec': 'mp3',
            'preferredquality': '128',
        }],
        'quiet': True,
        'no_warnings': True,
        'nocheckcertificate': True,
        'user_agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
        'referer': 'https://www.google.com/',
        'socket_timeout': 60,
        'retries': 10,
    }
    
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        info = ydl.extract_info(video_url, download=True)
        # The filename after post-processing will have .mp3 extension
        temp_audio_file = ydl.prepare_filename(info).rsplit('.', 1)[0] + '.mp3'
        
    return temp_audio_file