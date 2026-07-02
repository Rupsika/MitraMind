import streamlit as st
import os
from pathlib import Path
from dotenv import load_dotenv

# Ensure environment variables are loaded
load_dotenv()

# App imports
import config
from rag.retriever import MitraRAG
from voice.sarvam_client import is_voice_configured, transcribe_audio, synthesize_speech
from voice.audio_utils import get_audio_html_tag, validate_audio

# Page Configuration
st.set_page_config(
    page_title="MitraMind — Multilingual Mental Health Companion",
    page_icon="🧠",
    layout="centered"
)

# Load and inject custom CSS stylesheet
def load_css():
    if config.STYLE_CSS_PATH.exists():
        with open(config.STYLE_CSS_PATH, "r", encoding="utf-8") as f:
            st.markdown(f"<style>{f.read()}</style>", unsafe_allow_html=True)
    else:
        st.warning("Styling sheet assets/style.css not found. Running with default styles.")

load_css()

# Initialize Mitra RAG pipeline (cached to avoid rebuilding/reloading index every interaction)
@st.cache_resource
def get_rag_pipeline():
    return MitraRAG()

rag_pipeline = get_rag_pipeline()

# Initialize Session State
if "chat_history" not in st.session_state:
    st.session_state.chat_history = []  # List of dict: {"role": "user"|"bot", "text": str, "audio": bytes|None, "sources": list|None}

if "crisis_triggered" not in st.session_state:
    st.session_state.crisis_triggered = False

if "last_processed_audio" not in st.session_state:
    st.session_state.last_processed_audio = None

# Main Title Header with rich typography
st.markdown(
    """
    <div class="title-container">
        <h1 class="gradient-text">MitraMind</h1>
        <p class="subtitle-text">Your Multilingual Mental Health Companion (मित्रा)</p>
    </div>
    """,
    unsafe_allow_html=True
)

# Sidebar Configuration Layout
with st.sidebar:
    st.markdown("### ⚙️ System Settings")
    
    # 1. Language selector
    selected_lang_name = st.selectbox(
        "Preferred Language / भाषा",
        options=list(config.LANGUAGES.keys()),
        index=0
    )
    lang_info = config.LANGUAGES[selected_lang_name]
    
    st.divider()
    
    # 2. Voice settings
    st.markdown("### 🎙️ Voice Settings")
    voice_enabled = is_voice_configured()
    
    if voice_enabled:
        voice_response = st.checkbox("Enable Auto Voice Output (TTS)", value=True)
        st.success("Sarvam AI Voice API is fully active.")
    else:
        voice_response = False
        st.checkbox("Enable Auto Voice Output (TTS)", value=False, disabled=True)
        st.info("💡 To enable voice transcription and playback, supply a `SARVAM_API_KEY` in your `.env` file.")
        
    st.divider()
    
    # 3. Vector Database status
    st.markdown("### 📚 Knowledge Base Status")
    db_ready = rag_pipeline.is_index_available()
    if db_ready:
        st.success("Vector DB Index is online (FAISS)")
    else:
        st.error("Vector DB Index is offline!")
        st.markdown(
            """
            Please run document ingestion in your terminal:
            ```bash
            python data/ingest_docs.py
            ```
            """
        )
        
    st.divider()
    
    # 4. Clear conversation button
    if st.button("Reset Conversation", use_container_width=True):
        st.session_state.chat_history = []
        st.session_state.crisis_triggered = False
        st.session_state.last_processed_audio = None
        st.rerun()

# Display Crisis Helpline Info Banner if crisis is triggered
if st.session_state.crisis_triggered:
    st.markdown(
        f"""
        <div class="crisis-banner">
            <h3>{config.HELPLINES['title']}</h3>
            <p>{config.HELPLINES['message']}</p>
            <ul>
                {"".join([f"<li><b>{hl['name']}:</b> <a href='tel:{hl['number']}' style='color: #ef4444; font-weight: bold;'>{hl['number']}</a> ({hl['availability']})</li>" for hl in config.HELPLINES['numbers']])}
            </ul>
        </div>
        """,
        unsafe_allow_html=True
    )

# Render Chat History with custom bubbles and embedded audio players
chat_placeholder = st.container()

with chat_placeholder:
    st.markdown('<div class="chat-container">', unsafe_allow_html=True)
    for i, msg in enumerate(st.session_state.chat_history):
        if msg["role"] == "user":
            st.markdown(f'<div class="user-bubble">{msg["text"]}</div>', unsafe_allow_html=True)
        else:
            # Bot bubble containing text + citations
            sources_html = ""
            if msg.get("sources"):
                sources_str = ", ".join(msg["sources"])
                sources_html = f'<div class="source-citation">Citations: {sources_str}</div>'
                
            st.markdown(
                f'<div class="bot-bubble">{msg["text"]}{sources_html}</div>', 
                unsafe_allow_html=True
            )
            
            # Embed audio player if present
            if msg.get("audio"):
                st.audio(msg["audio"], format="audio/wav")
    st.markdown('</div>', unsafe_allow_html=True)

# Define callback to process text input
def handle_text_submit():
    user_query = st.session_state.text_input.strip()
    if not user_query:
        return
        
    # Append user question
    st.session_state.chat_history.append({"role": "user", "text": user_query, "audio": None})
    
    # Process through RAG
    # Formulate conversational history format for the agent
    history_tuples = []
    # Build list of (user_text, bot_text)
    temp_hist = []
    for m in st.session_state.chat_history[:-1]:
        if m["role"] == "user":
            temp_hist.append(m["text"])
        elif m["role"] == "bot" and len(temp_hist) > 0:
            history_tuples.append((temp_hist.pop(), m["text"]))
            
    with st.spinner("Mitra is typing..."):
        result = rag_pipeline.query(
            question=user_query,
            history=history_tuples,
            language=selected_lang_name
        )
        
    bot_text = result["answer"]
    sources = result["sources"]
    crisis = result["crisis_triggered"]
    
    # Synthesize audio if requested and keys exist
    audio_bytes = None
    if voice_response and voice_enabled:
        with st.spinner("Synthesizing voice response..."):
            try:
                # Strip citations text for cleaner audio synthesis
                clean_text = bot_text.split("Source Guidelines:")[0].split("Citations:")[0].strip()
                audio_bytes = synthesize_speech(clean_text, lang_info["sarvam_tts_lang"])
            except Exception as e:
                st.error(f"Failed to generate voice response: {str(e)}")
                
    st.session_state.chat_history.append({
        "role": "bot",
        "text": bot_text,
        "audio": audio_bytes,
        "sources": sources
    })
    
    if crisis:
        st.session_state.crisis_triggered = True
        
    # Clear text input
    st.session_state.text_input = ""

# Input Form Area (Text + Audio inputs)
st.divider()

# Audio recording widget
st.markdown("### 🎙️ Speak to Mitra")
if voice_enabled:
    if hasattr(st, "audio_input"):
        recorded_audio = st.audio_input("Record speech (Hindi, Telugu, Tamil, English)")
    else:
        recorded_audio = st.file_uploader("Upload audio recording (.wav)", type=["wav", "mp3"])
        
    if recorded_audio is not None:
        audio_bytes = recorded_audio.read()
        
        # Audio de-duplication check to prevent rerun loops
        if audio_bytes != st.session_state.last_processed_audio:
            st.session_state.last_processed_audio = audio_bytes
            
            if validate_audio(audio_bytes):
                with st.spinner("Transcribing your audio..."):
                    try:
                        transcribed_text = transcribe_audio(audio_bytes, lang_info["sarvam_asr_lang"])
                        
                        if transcribed_text:
                            # Append user question
                            st.session_state.chat_history.append({"role": "user", "text": transcribed_text, "audio": None})
                            
                            # Formulate history for RAG query
                            history_tuples = []
                            temp_hist = []
                            for m in st.session_state.chat_history[:-1]:
                                if m["role"] == "user":
                                    temp_hist.append(m["text"])
                                elif m["role"] == "bot" and len(temp_hist) > 0:
                                    history_tuples.append((temp_hist.pop(), m["text"]))
                                    
                            with st.spinner("Mitra is typing..."):
                                result = rag_pipeline.query(
                                    question=transcribed_text,
                                    history=history_tuples,
                                    language=selected_lang_name
                                )
                                
                            bot_text = result["answer"]
                            sources = result["sources"]
                            crisis = result["crisis_triggered"]
                            
                            # Synthesize output audio
                            bot_audio_bytes = None
                            if voice_response:
                                with st.spinner("Synthesizing voice response..."):
                                    try:
                                        clean_text = bot_text.split("Source Guidelines:")[0].split("Citations:")[0].strip()
                                        bot_audio_bytes = synthesize_speech(clean_text, lang_info["sarvam_tts_lang"])
                                    except Exception as e:
                                        st.error(f"Failed to generate voice response: {str(e)}")
                                        
                            st.session_state.chat_history.append({
                                "role": "bot",
                                "text": bot_text,
                                "audio": bot_audio_bytes,
                                "sources": sources
                            })
                            
                            if crisis:
                                st.session_state.crisis_triggered = True
                                
                            st.rerun()
                        else:
                            st.warning("Could not transcribe audio. Please try speaking clearly or typing instead.")
                    except Exception as e:
                        st.error(f"Audio transcription error: {str(e)}")
            else:
                st.warning("Audio capture too short or invalid.")
else:
    st.info("Voice input is disabled. Add `SARVAM_API_KEY` to `.env` to record voice queries.")

# Text box input
st.markdown("### 💬 Type your message")
st.text_input(
    "Ask a question or share how you are feeling:",
    key="text_input",
    on_change=handle_text_submit,
    placeholder="Ask me about stress management, mental health guidelines, or just share your feelings..."
)
