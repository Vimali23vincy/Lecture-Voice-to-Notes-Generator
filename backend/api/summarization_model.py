from transformers import BartTokenizer, BartForConditionalGeneration
import os

# Global models to avoid reloading on every request
_model = None
_tokenizer = None

def load_models():
    global _model, _tokenizer
    if _model is not None:
        return _model, _tokenizer

    model_path = 'fine_tuned_bart_model'
    
    # Check if model file is likely a Git LFS pointer (very small size)
    weights_path = os.path.join(model_path, 'model.safetensors')
    if os.path.exists(weights_path) and os.path.getsize(weights_path) < 1000:
        print(f"Warning: {weights_path} appears to be a Git LFS pointer. Falling back to 'facebook/bart-base'.")
        model_name = 'facebook/bart-base'
    elif not os.path.exists(model_path):
        print(f"Warning: {model_path} not found. Falling back to 'facebook/bart-base'.")
        model_name = 'facebook/bart-base'
    else:
        model_name = model_path

    try:
        print(f"Loading summarization model: {model_name}...")
        _model = BartForConditionalGeneration.from_pretrained(model_name)
        _tokenizer = BartTokenizer.from_pretrained(model_name)
    except Exception as e:
        print(f"Error loading {model_name}: {e}. Falling back to 'facebook/bart-base'.")
        _model = BartForConditionalGeneration.from_pretrained('facebook/bart-base')
        _tokenizer = BartTokenizer.from_pretrained('facebook/bart-base')
    
    return _model, _tokenizer

def call_summarization_model(lecture_transcript):
    """Call the fine-tuned BART model to generate a summary with chunking for long text."""
    model, tokenizer = load_models()

    # If transcript is very long, split into chunks of ~800 words
    words = lecture_transcript.split()
    chunk_size = 800
    if len(words) > chunk_size:
        print(f"Transcript too long ({len(words)} words). Processing in chunks...")
        summaries = []
        for i in range(0, len(words), chunk_size):
            chunk_text = " ".join(words[i:i + chunk_size])
            inputs = tokenizer(chunk_text, return_tensors="pt", max_length=1024, truncation=True)
            summary_ids = model.generate(
                inputs['input_ids'], 
                max_length=150, 
                num_beams=1, # Greedy search is MUCH faster than beam search
                no_repeat_ngram_size=3,
                repetition_penalty=1.2,
                early_stopping=True
            )
            summaries.append(tokenizer.decode(summary_ids[0], skip_special_tokens=True))
        
        # Combine chunk summaries
        final_text = " ".join(summaries)
        # If the combined summary is still too long, summarize it one last time
        if len(final_text.split()) > chunk_size:
            return call_summarization_model(final_text)
        return final_text
    else:
        # Standard processing for short/medium text
        inputs = tokenizer(lecture_transcript, return_tensors="pt", max_length=1024, truncation=True)
        summary_ids = model.generate(
            inputs['input_ids'], 
            max_length=500, 
            num_beams=1, # Greedy search for speed
            no_repeat_ngram_size=3,
            repetition_penalty=1.2,
            length_penalty=1.0, 
            early_stopping=True
        )
        generated_summary = tokenizer.decode(summary_ids[0], skip_special_tokens=True)
        print("Generated Summary Success")
        return generated_summary