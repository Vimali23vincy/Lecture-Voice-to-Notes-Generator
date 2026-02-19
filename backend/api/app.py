import os
from flask import Flask, request, render_template, send_from_directory, make_response
from flask_restful import Resource, Api
from flask_cors import CORS

from generate_audio import generate_audio
from summarization_model import call_summarization_model
from transcribe import transcribe_lecture
import traceback

# Configure Flask to serve the React build folder
app = Flask(__name__, 
            static_folder=os.path.abspath("../../frontend/build"),
            template_folder=os.path.abspath("../../frontend/build"))

# Disable static file caching so new builds are always loaded
app.config['SEND_FILE_MAX_AGE_DEFAULT'] = 0

CORS(app)
api = Api(app)


@app.route("/", defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    if path != "" and os.path.exists(os.path.join(app.static_folder, path)):
        response = make_response(send_from_directory(app.static_folder, path))
        # Allow caching for hashed JS/CSS files (they change name on rebuild)
        if path.startswith('static/'):
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
            # Generate audio from the YouTube link
            audio_data = generate_audio(youtube_link)

            # Transcribe the audio
            transcribed_text = transcribe_lecture(audio_data)

            # Summarize the transcribed text using the fine-tuned BART model
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
        """Transcribes an audio file and summarizes the transcribed text using a fine-tuned BART model."""
        transcribed_text = request.json.get('finalTranscript')

        if not transcribed_text:
            return {'error': 'Missing "finalTranscript" in request body'}, 400

        try:
            # Summarize the transcribed text using the fine-tuned BART model
            summary = call_summarization_model(transcribed_text)

            # Return the summary as a JSON response
            return {'summary': summary}
        except Exception as e:
            app.logger.exception('Error processing record-summary')
            tb = traceback.format_exc()
            return {'error': str(e), 'trace': tb[:1000]}, 500

    def get(self):
        return {'msg': "Welcome to Live Audio Summary Page"}


api.add_resource(LinkSummary, '/api/link-summary')
api.add_resource(RecordSummary, '/api/record-summary')


class Echo(Resource):
    def post(self):
        # quick echo endpoint for testing frontend connectivity
        return request.json

    def get(self):
        return {'msg': 'Echo endpoint active'}


api.add_resource(Echo, '/api/echo')


class LinkSummaryDev(Resource):
    def post(self):
        # lightweight fake summary for frontend development/testing
        data = request.json or {}
        link = data.get('link', '')
        return {'summary': f'FAKE SUMMARY (dev): received link "{link}"'}


class RecordSummaryDev(Resource):
    def post(self):
        data = request.json or {}
        transcript = data.get('finalTranscript', '')
        return {'summary': f'FAKE SUMMARY (dev): received transcript length {len(transcript)}'}


api.add_resource(LinkSummaryDev, '/api/link-summary-dev')
api.add_resource(RecordSummaryDev, '/api/record-summary-dev')

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=int(os.environ.get('PORT', 8080)))
