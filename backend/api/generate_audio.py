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
            'preferredquality': '128', # Lower quality for faster processing
        }],
        'quiet': True,
        'no_warnings': True,
        'nocheckcertificate': True,
        'extract_flat': False,
    }
    
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        info = ydl.extract_info(video_url, download=True)
        # The filename after post-processing will have .mp3 extension
        temp_audio_file = ydl.prepare_filename(info).rsplit('.', 1)[0] + '.mp3'
        
    return temp_audio_file