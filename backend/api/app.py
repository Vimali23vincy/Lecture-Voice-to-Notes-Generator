import os
import re
import traceback
from flask import Flask, request, render_template, send_from_directory, make_response
from flask_restful import Resource, Api
from flask_cors import CORS

from generate_audio import generate_audio
from youtube_transcript_api import YouTubeTranscriptApi
from summarization_model import call_summarization_model
from transcribe import transcribe_lecture

# Configure Flask to serve the React build folder
app = Flask(__name__, 
            static_folder=os.path.abspath("../../frontend/build"),
            template_folder=os.path.abspath("../../frontend/build"))

# Disable static file caching
app.config['SEND_FILE_MAX_AGE_DEFAULT'] = 0
CORS(app)
api = Api(app)

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    if path != "" and os.path.exists(app.static_folder + '/' + path):
        response = send_from_directory(app.static_folder, path)
        if any(path.endswith(ext) for ext in ['.js', '.css', '.png', '.jpg', '.svg', '.json']):
            response.headers['Cache-Control'] = 'public, max-age=31536000'
        else:
            response.headers['Cache-Control'] = 'no-store, no-cache, must-revalidate'
        return response
    else:
        response = make_response(render_template("index.html"))
        response.headers['Cache-Control'] = 'no-store, no-cache, must-revalidate'
        response.headers['Pragma'] = 'no-cache'
        response.headers['Expires'] = '0'
        return response

class LinkSummary(Resource):
    def post(self):
        """Summarizes a YouTube lecture given a link."""
        youtube_link = request.json.get('link')

        if not youtube_link:
            return {'error': 'Missing "link" in request body'}, 400

        try:
            # Enhanced video ID extraction
            video_id = None
            regex = r"(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^\"&?\/\s]{11})"
            match = re.search(regex, youtube_link)
            if match:
                video_id = match.group(1)
            
            transcribed_text = ""
            if video_id:
                try:
                    # Specific language order to increase success chance
                    transcript_list = YouTubeTranscriptApi.get_transcript(video_id, languages=['en', 'en-US', 'en-GB'])
                    transcribed_text = " ".join([t['text'] for t in transcript_list])
                except Exception as e:
                    app.logger.error(f"Transcript fetch failed: {str(e)}")

            if not transcribed_text:
                return {'error': 'Could not get transcript from YouTube. The video might not have captions enabled, or the server is blocked.'}, 400

            # Summarize the transcribed text
            summary = call_summarization_model(transcribed_text)

            # Return the summary as a JSON response
            return {'summary': summary}
        except Exception as e:
            app.logger.exception('Error processing link-summary')
            tb = traceback.format_exc()
            return {'error': str(e), 'trace': tb[:1000]}, 500
    
    def get(self):
        return {'msg': "Welcome to YouTube Summary Page"}

class RecordSummary(Resource):
    def post(self):
        """Transcribes an audio file and summarizes the transcribed text."""
        transcribed_text = request.json.get('finalTranscript')

        if not transcribed_text:
            return {'error': 'Missing "finalTranscript" in request body'}, 400

        try:
            summary = call_summarization_model(transcribed_text)
            return {'summary': summary}
        except Exception as e:
            app.logger.exception('Error processing record-summary')
            tb = traceback.format_exc()
            return {'error': str(e), 'trace': tb[:1000]}, 500

    def get(self):
        return {'msg': "Welcome to Live Audio Summary Page"}

api.add_resource(LinkSummary, '/api/link-summary')
api.add_resource(RecordSummary, '/api/record-summary')

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=int(os.environ.get('PORT', 7860)))
