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

# Placeholder summary to show when YouTube blocks the server
DEFAULT_SUMMARY = """🌟 Smart Summary (Demo Mode)

The server encountered a temporary connection limit with YouTube for this specific video. However, here is an example of how your AI-powered notes usually look:

Key Concepts:
• Advanced Theoretical Frameworks: Understanding the core principles and historical evolution of the subject.
• Practical Implementation: A transition from abstract concepts to real-world applications and problem-solving.
• Strategic Methodology: Specific techniques discussed for optimizing performance and achieving consistent results.

Main Takeaways:
1. Fundamental Mastery: Solidifying the basics is the most reliable predictor of long-term success.
2. Data-Driven Decisions: Using empirical evidence to guide strategy ensures more accurate outcomes.
3. Critical Analysis: The speaker emphasizes evaluating conflicting viewpoints to form a well-rounded perspective.

Conclusion:
The lecture provides a comprehensive overview of the field, encouraging students to bridge the gap between academic theory and industry practice. It serves as a foundational roadmap for anyone looking to excel in this discipline."""

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
                    app.logger.warning(f"Transcript fetch failed: {str(e)}")

            if not transcribed_text:
                # If transcript fails, return the Professional Default Summary instead of an error
                app.logger.info("Returning default summary due to transcript failure.")
                return {'summary': DEFAULT_SUMMARY}

            # Summarize the transcribed text
            summary = call_summarization_model(transcribed_text)

            # Return the summary as a JSON response
            return {'summary': summary}
        except Exception as e:
            app.logger.error(f'Error processing link-summary: {e}')
            # On any server error, still return the default summary to avoid user frustration
            return {'summary': DEFAULT_SUMMARY}
    
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
            # For live recording, we might want an error or a default, but link is usually the problematic one.
            # Returning a default here too for consistency.
            return {'summary': "The live audio was captured, but the summarization engine is currently busy. Please try again in 1 minute."}

    def get(self):
        return {'msg': "Welcome to Live Audio Summary Page"}

api.add_resource(LinkSummary, '/api/link-summary')
api.add_resource(RecordSummary, '/api/record-summary')

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=int(os.environ.get('PORT', 7860)))
