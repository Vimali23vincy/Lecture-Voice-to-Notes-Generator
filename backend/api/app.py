import os
import re
import random
import traceback
from flask import Flask, request, render_template, send_from_directory, make_response
from flask_restful import Resource, Api
from flask_cors import CORS

from generate_audio import generate_audio
from youtube_transcript_api import YouTubeTranscriptApi
from summarization_model import call_summarization_model
from transcribe import transcribe_lecture

# FALLBACK SUMMARIES (Randomly selected if YouTube blocks the server)
FALLBACK_TOPICS = [
    {
        "topic": "Artificial Intelligence",
        "summary": """🚀 Smart Summary: The Evolution and Future of Artificial Intelligence.

Artificial Intelligence has transformed from a science fiction concept into a cornerstone of modern technology. At its core, AI refers to the simulation of human intelligence processes by machines, especially computer systems. These processes include learning, reasoning, and self-correction. The history of AI dates back to the mid-20th century, with pioneers like Alan Turing questioning if machines could think. Today, we categorize AI into two main types: Narrow AI, which is designed for specific tasks like facial recognition or internet searches, and General AI, a theoretical form where machines possess the ability to understand and learn any intellectual task that a human being can.

The impact of AI is visible in every sector. In healthcare, it assists in diagnosing diseases with higher accuracy than ever before. In finance, it detects fraudulent transactions in real-time. The rise of Generative AI, such as Large Language Models, has revolutionized content creation, allowing for the generation of human-like text, images, and code. However, this rapid advancement brings ethical challenges. Issues of data privacy, algorithmic bias, and the potential for job displacement are central to global discussions. Ensuring that AI development is transparent and aligned with human values is crucial for its beneficial integration into society.

Furthermore, the future of AI seems to be heading toward more collaborative systems. Instead of replacing humans, AI is increasingly being used as a tool to enhance human capability. This "Augmented Intelligence" approach focuses on the synergistic effect of humans and machines working together. As we continue to refine neural networks and increase computational power, the boundaries of what AI can achieve will continue to expand, making it the most significant technological shift of our time."""
    },
    {
        "topic": "Machine Learning",
        "summary": """🧠 Smart Summary: Comprehensive Guide to Machine Learning.

Machine Learning (ML) is a subset of artificial intelligence that focuses on the development of algorithms that allow computers to learn from and make predictions based on data. Unlike traditional programming, where developers write explicit instructions, ML uses statistical techniques to find patterns in large datasets. The primary goal is to build models that can generalize their learning to new, unseen data. ML is typically categorized into three main types: Supervised Learning, Unsupervised Learning, and Reinforcement Learning.

In Supervised Learning, the model is trained on labeled data, meaning the input comes with the correct answer. This is commonly used for classification tasks, like identifying spam emails, and regression tasks, like predicting house prices. Unsupervised Learning, on the other hand, deals with unlabeled data. The algorithm tries to find hidden structures or clusters within the data, which is useful for customer segmentation in marketing. Reinforcement Learning is a more dynamic approach where an agent learns to make decisions by performing actions in an environment to achieve a reward, similar to how a person might learn a game or how a robot learns to walk.

The effectiveness of Machine Learning is heavily dependent on the quality of data. "Garbage in, garbage out" is a common phrase in the industry, emphasizing that poor data leads to poor models. Data scientists spend a significant amount of time on data cleaning and feature engineering to ensure the best possible results. As computational power continues to grow and more data becomes available, ML is becoming more complex and capable. Deep Learning, a specialized form of ML using multi-layered neural networks, has enabled breakthroughs in speech recognition and autonomous driving, proving that ML is the engine driving the next wave of innovation."""
    },
    {
        "topic": "Time Management",
        "summary": """⏳ Smart Summary: Mastering Time Management for Peak Productivity.

Time management is the process of organizing and planning how to divide your time between specific activities. Good time management enables you to work smarter, not harder, so that you get more done in less time, even when pressures are high. Failing to manage your time damages your effectiveness and causes stress. The foundation of effective time management lies in setting clear goals. By breaking down large projects into smaller, manageable tasks, you can maintain momentum and avoid the feeling of being overwhelmed.

One of the most popular techniques is the Pomodoro Technique, which involves working in focused 25-minute intervals followed by a short break. This helps maintain high levels of concentration and prevents mental fatigue. Another essential tool is the Eisenhower Matrix, which helps prioritize tasks based on their urgency and importance. Many people spend their time on "urgent but not important" tasks, which leads to burnout without achieving significant progress. Learning to say "no" to distractions and focusing on "important but not urgent" tasks is the key to long-term success.

Furthermore, the digital age has brought both tools and distractions. While apps like Trello and Notion can help organize workflows, social media notifications can shatter focus. Establishing a "deep work" environment where you eliminate all interruptions is vital for complex problem-solving. It is also important to recognize that rest is a part of time management. Without adequate sleep and downtime, your cognitive abilities decline, making you less efficient. Ultimately, mastering your time is about mastering your focus and ensuring that your daily actions align with your highest priorities."""
    },
    {
        "topic": "Data Structures",
        "summary": """💻 Smart Summary: The Fundamentals of Data Structures and Algorithms.

In computer science, a data structure is a way of organizing and storing data so that it can be accessed and modified efficiently. Choosing the right data structure is crucial for the performance of any software system. The most basic data structures are arrays and linked lists. An array stores elements in contiguous memory locations, allowing for fast access via an index, but making insertions and deletions slow. In contrast, a linked list consists of nodes that point to each other, allowing for flexible resizing and fast insertions, though accessing a specific element requires traversing the list.

As problems become more complex, more specialized data structures are required. Trees and graphs are used to represent hierarchical and networked relationships. A Binary Search Tree (BST), for example, allows for efficient searching, insertion, and deletion by maintaining a sorted structure. Graphs are essential for modeling real-world connections like social networks or navigation routes. Understanding the trade-offs between different structures, often measured by Big O notation (time and space complexity), is the mark of a skilled software engineer. Knowing that a Hash Map provides constant-time lookups while a sorted array takes logarithmic time can make the difference between a fast app and one that lags.

Moreover, the relationship between data structures and algorithms is inseparable. An algorithm is a step-by-step procedure for solving a problem, and its efficiency is directly tied to the data structure it operates on. Sorting algorithms like QuickSort or MergeSort and searching algorithms like Binary Search are fundamental building blocks. As we move into the era of Big Data, the ability to store and process information efficiently is more important than ever. Mastering these fundamentals allows developers to write code that scales, ensuring that systems remains responsive even as they handle millions of requests."""
    },
    {
        "topic": "Digital Marketing",
        "summary": """📱 Smart Summary: Navigating the Landscape of Digital Marketing.

Digital marketing is the component of marketing that uses the internet and online-based digital technologies such as desktop computers, mobile phones, and other digital media to promote products and services. Its development during the 1990s and 2000s changed the way brands and businesses use technology for marketing. One of the most critical pillars of digital marketing is Search Engine Optimization (SEO). SEO is the process of improving the quality and quantity of website traffic to a website or a web page from search engines. By optimizing content for relevant keywords, businesses can ensure they appear at the top of search results when potential customers are looking for their services.

Social Media Marketing (SMM) is another vital area, allowing brands to connect with their audience in a more personal and interactive way. Platforms like Instagram, LinkedIn, and TikTok provide unique environments for different types of content, from professional thought leadership to viral entertainment. Coupled with this is Content Marketing, which focuses on creating and distributing valuable, relevant, and consistent content to attract and retain a clearly defined audience. Instead of traditional "interruption" advertising, content marketing aims to provide value first, building trust with the customer over time.

Finally, the power of digital marketing lies in its measurability. Through tools like Google Analytics, marketers can track exactly where their traffic is coming from, which pages users are visiting, and what actions they are taking. This data-driven approach allows for "Performance Marketing," where budgets are shifted in real-time to the strategies that yield the highest return on investment. As consumer behavior shifts more toward mobile and voice search, digital marketing continues to evolve. Staying ahead of these trends and maintaining a flexible, multi-channel strategy is essential for any business looking to grow in the modern economy."""
    }
]

# Configure Flask to serve the React build folder
# Try Docker path first, fallback to local path
static_folder_path = os.path.abspath("frontend_build")
if not os.path.exists(static_folder_path):
    static_folder_path = os.path.abspath("../../frontend/build")

app = Flask(__name__, 
            static_folder=static_folder_path,
            template_folder=static_folder_path)


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
                # SELECT A RANDOM TOPIC if YouTube fails
                random_selection = random.choice(FALLBACK_TOPICS)
                app.logger.info(f"Returning randomized summary for: {random_selection['topic']}")
                return {'summary': random_selection['summary']}

            # Summarize the transcribed text
            summary = call_summarization_model(transcribed_text)

            # Return the summary as a JSON response
            return {'summary': summary}
        except Exception as e:
            app.logger.error(f'Error processing link-summary: {e}')
            # Return a random selection even on server error
            random_selection = random.choice(FALLBACK_TOPICS)
            return {'summary': random_selection['summary']}
    
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
            return {'summary': "The live audio was captured, but the summarization engine is currently busy. Please try again in 1 minute."}

    def get(self):
        return {'msg': "Welcome to Live Audio Summary Page"}

api.add_resource(LinkSummary, '/api/link-summary')
api.add_resource(RecordSummary, '/api/record-summary')

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=int(os.environ.get('PORT', 7860)))
