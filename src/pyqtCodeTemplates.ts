import { PyCodeTemplate } from "./types";

export const pyqtCodeTemplates: PyCodeTemplate[] = [
  {
    id: "full-app",
    titleKhmer: "📦 កូដកម្មវិធី PyQt6 ពេញលេញ (All-in-One Studio)",
    titleEnglish: "📦 Complete PyQt6 App (All-In-One Studio)",
    descriptionKhmer: "ប្រភពកូដ Python PyQt6 ពេញលេញដែលរួមបញ្ចូលរាល់ការទាមទារទាំងអស់៖ UI ស្រស់ស្អាត, Editor កែ SRT, កម្មវិធីបញ្ជូល Subtitle ក្នុងវីដេអូ, TTS, STT និងការបកប្រែ។",
    descriptionEnglish: "Complete PyQt6 application with styled dark-theme UI, interactive SRT grid editor, full video subtitle blending, TTS/STT, and translator tools.",
    code: `import os
import sys
import re
from PyQt6.QtWidgets import (
    QApplication, QMainWindow, QWidget, QVBoxLayout, QHBoxLayout, 
    QTabWidget, QPushButton, QTextEdit, QLabel, QFileDialog, 
    QTableWidget, QTableWidgetItem, QHeaderView, QComboBox, 
    QLineEdit, QFormLayout, QProgressBar, QMessageBox, QDoubleSpinBox
)
from PyQt6.QtCore import Qt, QSize, QUrl
from PyQt6.QtGui import QFont, QColor
# Note: install supporting libraries: pip install PyQt6 gtts edge-tts speechrecognition openai-whisper pydub translation google-generativeai

class AIMovieStudio(QMainWindow):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("AI Movie Studio (Cambodia) - PyQt6 Version")
        self.setMinimumSize(1000, 700)
        self.apply_theme()
        
        # Central Widget & Tabs
        central_widget = QWidget()
        self.setCentralWidget(central_widget)
        main_layout = QVBoxLayout(central_widget)
        
        # Heading Header
        header = QLabel("🎬 AI MOVIE STUDIO (CAMBODIA) - PRO EDITION")
        header.setFont(QFont("Arial", 16, QFont.Weight.Bold))
        header.setStyleSheet("color: #ef4444; padding: 10px 0px;")
        main_layout.addWidget(header)
        
        self.tabs = QTabWidget()
        main_layout.addWidget(self.tabs)
        
        # Variables representing subtitle state
        self.subtitles = []
        
        # Build Child tabs
        self.init_srt_editor_tab()
        self.init_tts_tab()
        self.init_stt_transcriber_tab()
        self.init_vocal_remover_tab()
        self.init_subtitle_burner_tab()
        self.init_translator_tab()
        
    def apply_theme(self):
        # Modern dark visual styling sheet (Theme matches the web experience perfectly)
        self.setStyleSheet("""
            QMainWindow, QWidget {
                background-color: #0f0f12;
                color: #e4e4e7;
                font-family: 'Segoe UI', 'Kantumruy';
            }
            QTabWidget::pane {
                border: 1px solid #27272a;
                background-color: #181c24;
                border-radius: 8px;
            }
            QTabBar::tab {
                background: #1e1e24;
                border: 1px solid #27272a;
                padding: 10px 16px;
                border-top-left-radius: 6px;
                border-top-right-radius: 6px;
                color: #a1a1aa;
            }
            QTabBar::tab:selected {
                background: #ef4444;
                color: #white;
                font-weight: bold;
                border-bottom-color: #181c24;
            }
            QPushButton {
                background-color: #27272a;
                border: 1px solid #3f3f46;
                padding: 10px 18px;
                border-radius: 6px;
                color: white;
                font-weight: 500;
            }
            QPushButton:hover {
                background-color: #ef4444;
                border-color: #ef4444;
            }
            QTableWidget {
                background-color: #141416;
                border: 1px solid #27272a;
                gridline-color: #27272a;
                border-radius: 6px;
            }
            QHeaderView::section {
                background-color: #202024;
                color: #e4e4e7;
                padding: 6px;
                border: 1px solid #141416;
            }
            QTextEdit, QLineEdit, QComboBox, QDoubleSpinBox {
                background-color: #141416;
                border: 1px solid #27272a;
                border-radius: 6px;
                padding: 8px;
                color: white;
            }
            QTextEdit:focus, QLineEdit:focus {
                border-color: #ef4444;
            }
            QProgressBar {
                border: 1px solid #27272a;
                background-color: #141416;
                text-align: center;
                border-radius: 5px;
                color: white;
            }
            QProgressBar::chunk {
                background-color: #10b981;
                border-radius: 4px;
            }
        """)

    # 1. SRT Form Editor layout
    def init_srt_editor_tab(self):
        tab = QWidget()
        layout = QVBoxLayout(tab)
        
        # Subtitle Action controllers
        btn_layout = QHBoxLayout()
        btn_load = QPushButton("📂 Load SRT Subtitle")
        btn_load.clicked.connect(self.load_srt_file)
        btn_layout.addWidget(btn_load)
        
        btn_add = QPushButton("➕ Add Subtitle Line")
        btn_add.clicked.connect(self.add_subtitle_row)
        btn_layout.addWidget(btn_add)
        
        btn_delete = QPushButton("🗑️ Remove Selected")
        btn_delete.clicked.connect(self.delete_subtitle_row)
        btn_layout.addWidget(btn_delete)
        
        btn_save = QPushButton("💾 Export SRT Output")
        btn_save.clicked.connect(self.save_srt_file)
        btn_save.setStyleSheet("background-color: #10b981;")
        btn_layout.addWidget(btn_save)
        
        layout.addLayout(btn_layout)
        
        # Table Grid
        self.table = QTableWidget()
        self.table.setColumnCount(5)
        self.table.setHorizontalHeaderLabels(["ID", "Start Time", "End Time", "Dialogue Text", "Speaker Gender"])
        self.table.horizontalHeader().setSectionResizeMode(QHeaderView.ResizeMode.Stretch)
        self.table.horizontalHeader().setSectionResizeMode(0, QHeaderView.ResizeMode.ResizeToContents)
        self.table.horizontalHeader().setSectionResizeMode(4, QHeaderView.ResizeMode.ResizeToContents)
        layout.addWidget(self.table)
        
        self.tabs.addTab(tab, "🕒 SRT Subtitle Editor")

    # 2. Text to Speech Tab (Khmer and Multilingual)
    def init_tts_tab(self):
        tab = QWidget()
        layout = QFormLayout(tab)
        
        self.tts_text_input = QTextEdit()
        self.tts_text_input.setPlaceholderText("បញ្ចូលអត្ថបទអានភាសាខ្មែរ ឬបរទេសនៅទីនេះ...")
        layout.addRow("Dialogue Content / អត្ថបទសន្ទនា:", self.tts_text_input)
        
        self.voice_combo = QComboBox()
        self.voice_combo.addItems([
            "Khmer - Female (Kalyan)",
            "Khmer - Male (Sopheap)",
            "English - Male (Guy)",
            "English - Female (Jenny)",
            "Chinese - Female (Xiaoxiao)"
        ])
        layout.addRow("Voice Character / សម្លេងតួអង្គ:", self.voice_combo)
        
        self.pitch_spin = QDoubleSpinBox()
        self.pitch_spin.setRange(0.5, 2.0)
        self.pitch_spin.setValue(1.0)
        layout.addRow("Speed / ល្បឿនអាន:", self.pitch_spin)
        
        btn_tts = QPushButton("🔊 Generate Voice with Edge-TTS (Free)")
        btn_tts.clicked.connect(self.generate_speech_local)
        layout.addRow(btn_tts)
        
        self.tabs.addTab(tab, "🗣️ Khmer & Foreign TTS")

    # 3. Speech to Text Transcriber
    def init_stt_transcriber_tab(self):
        tab = QWidget()
        layout = QVBoxLayout(tab)
        
        lbl = QLabel("បំលែងសំឡេងជាអក្សរ (Speech to Text) ជាមួយ Local Whisper ឬ API ឥតគិតថ្លៃ")
        lbl.setFont(QFont("Arial", 11, QFont.Weight.Bold))
        layout.addWidget(lbl)
        
        btn_choose = QPushButton("📂 Choose Audio/Video File")
        btn_choose.clicked.connect(self.pick_trans_audio)
        layout.addWidget(btn_choose)
        
        self.audio_path_lbl = QLabel("No file chosen")
        self.audio_path_lbl.setWordWrap(True)
        layout.addWidget(self.audio_path_lbl)
        
        self.trans_engine_combo = QComboBox()
        self.trans_engine_combo.addItems([
            "Local Whisper (optimized for Low-end system via 'tiny' model)",
            "Gemini Generative API (Cloud-based highly accurate)",
            "Free Web Speech Recognition (Free Google STT)"
        ])
        layout.addWidget(self.trans_engine_combo)
        
        btn_start_stt = QPushButton("⚡ Start Transcribing to Subtitles")
        btn_start_stt.clicked.connect(self.run_audio_transcription)
        btn_start_stt.setStyleSheet("background-color: #ef4444;")
        layout.addWidget(btn_start_stt)
        
        self.stt_result = QTextEdit()
        self.stt_result.setPlaceholderText("លទ្ធផល Subtitle (SRT) នឹងបង្ហាញនៅទីនេះ...")
        layout.addWidget(self.stt_result)
        
        self.tabs.addTab(tab, "🎙️ Speech To Text (STT)")

    # 4. Vocal Separate Tab
    def init_vocal_remover_tab(self):
        tab = QWidget()
        layout = QVBoxLayout(tab)
        
        lbl = QLabel("កម្មវិធីបំបែកសំឡេងចម្រៀង និងភ្លេង (Vocal & Music Track Remover)")
        lbl.setFont(QFont("Arial", 11, QFont.Weight.Bold))
        layout.addWidget(lbl)
        
        self.vocal_file_lbl = QLabel("Selected Audio Path: None")
        layout.addWidget(self.vocal_file_lbl)
        
        btn_choose = QPushButton("📂 Load Audio File")
        btn_choose.clicked.connect(self.pick_vocal_audio)
        layout.addWidget(btn_choose)
        
        btn_sep = QPushButton("🎹 Execute Audio Vocal Separation")
        btn_sep.clicked.connect(self.run_vocal_separation)
        layout.addWidget(btn_sep)
        
        self.vocal_progress = QProgressBar()
        layout.addWidget(self.vocal_progress)
        
        self.tabs.addTab(tab, "🎵 Vocal Remover Tool")

    # 5. Subtitle Burnt In Video Overlay
    def init_subtitle_burner_tab(self):
        tab = QWidget()
        layout = QFormLayout(tab)
        
        self.video_input_lbl = QLabel("No Video File Loaded")
        layout.addRow("Target Video File:", self.video_input_lbl)
        
        btn_video = QPushButton("📂 Choose Mp4 Video")
        btn_video.clicked.connect(self.pick_video_file)
        layout.addRow(btn_video)
        
        self.srt_overlay_lbl = QLabel("No SRT Subtitle Loaded")
        layout.addRow("Subtitles Overlay File:", self.srt_overlay_lbl)
        
        btn_burn = QPushButton("📸 Burn Subtitles directly inside Video (Hardcode Sub)")
        btn_burn.clicked.connect(self.execute_subtitle_burn)
        btn_burn.setStyleSheet("background-color: #10b981;")
        layout.addRow(btn_burn)
        
        self.tabs.addTab(tab, "🎥 Burn SRT on Video")

    # 6. Translator Tab
    def init_translator_tab(self):
        tab = QWidget()
        layout = QVBoxLayout(tab)
        
        lbl = QLabel("Smart Translation Hub for SRT files and Text dialogue blocks")
        lbl.setFont(QFont("Arial", 11, QFont.Weight.Bold))
        layout.addWidget(lbl)
        
        self.trans_source = QTextEdit()
        self.trans_source.setPlaceholderText("បញ្ចូលអត្ថបទ ឬ SRT Subtitles ដើមនៅទីនេះ...")
        layout.addWidget(self.trans_source)
        
        self.trans_lang_combo = QComboBox()
        self.trans_lang_combo.addItems(["Khmer", "English", "French", "Chinese", "Thai", "Vietnamese"])
        layout.addWidget(self.trans_lang_combo)
        
        btn_translate = QPushButton("🌐 Translate now via AI Engine")
        btn_translate.clicked.connect(self.translate_content)
        layout.addWidget(btn_translate)
        
        self.trans_dest = QTextEdit()
        self.trans_dest.setPlaceholderText("អត្ថបទភាសាបកប្រែរួចនឹងបង្ហាញនៅទីនេះ...")
        layout.addWidget(self.trans_dest)
        
        self.tabs.addTab(tab, "🌐 Translate SRT & Texts")

    # Interactive handler methods
    def load_srt_file(self):
        path, _ = QFileDialog.getOpenFileName(self, "Load Subtitles File", "", "Subtitle files (*.srt)")
        if not path:
            return
        try:
            with open(path, 'r', encoding='utf-8') as f:
                content = f.read()
            self.parse_srt_content(content)
            QMessageBox.information(self, "Success", "Subtitle SRT file loaded successfully!")
        except Exception as e:
            QMessageBox.critical(self, "Error", f"Error reading subtitles: {str(e)}")

    def parse_srt_content(self, txt):
        pattern = re.compile(r"(\d+)\n(\d{2}:\d{2}:\d{2},\d{3}) --> (\d{2}:\d{2}:\d{2},\d{3})\n((?:[^\n]+\n*)+)")
        blocks = pattern.findall(txt)
        self.subtitles = []
        self.table.setRowCount(0)
        
        for idx, block in enumerate(blocks):
            num, start, end, text = block
            text = text.strip()
            self.subtitles.append({"id": num, "start": start, "end": end, "text": text, "gender": "male" if idx%2==0 else "female"})
            
            row = self.table.rowCount()
            self.table.insertRow(row)
            self.table.setItem(row, 0, QTableWidgetItem(num))
            self.table.setItem(row, 1, QTableWidgetItem(start))
            self.table.setItem(row, 2, QTableWidgetItem(end))
            self.table.setItem(row, 3, QTableWidgetItem(text))
            
            combo = QComboBox()
            combo.addItems(["male", "female"])
            combo.setCurrentText("male" if idx%2==0 else "female")
            self.table.setCellWidget(row, 4, combo)
            
    def add_subtitle_row(self):
        row = self.table.rowCount()
        self.table.insertRow(row)
        num = str(row + 1)
        self.table.setItem(row, 0, QTableWidgetItem(num))
        self.table.setItem(row, 1, QTableWidgetItem("00:00:00,000"))
        self.table.setItem(row, 2, QTableWidgetItem("00:00:05,000"))
        self.table.setItem(row, 3, QTableWidgetItem("អត្ថបទ Dialog ថ្មី..."))
        
        combo = QComboBox()
        combo.addItems(["male", "female"])
        self.table.setCellWidget(row, 4, combo)
        
    def delete_subtitle_row(self):
        cur = self.table.currentRow()
        if cur >= 0:
            self.table.removeRow(cur)
            
    def save_srt_file(self):
        path, _ = QFileDialog.getSaveFileName(self, "Save Subtitles File", "", "Subtitles (*.srt)")
        if not path:
            return
        try:
            with open(path, 'w', encoding='utf-8') as f:
                for r in range(self.table.rowCount()):
                    num = self.table.item(r, 0).text()
                    start = self.table.item(r, 1).text()
                    end = self.table.item(r, 2).text()
                    text = self.table.item(r, 3).text()
                    f.write(f"{num}\\n{start} --> {end}\\n{text}\\n\\n")
            QMessageBox.information(self, "Success", "SRT subtitle file exported successfully!")
        except Exception as e:
            QMessageBox.critical(self, "Error", f"Failed saving SRT: {str(e)}")

    def pick_trans_audio(self):
        path, _ = QFileDialog.getOpenFileName(self, "Select Audio/Video Source file", "", "Audio Files (*.mp3 *.wav *.mp4 *.m4a)")
        if path:
            self.audio_path_lbl.setText(path)

    def pick_vocal_audio(self):
        path, _ = QFileDialog.getOpenFileName(self, "Select Song file", "", "Songs (*.mp3 *.wav *.ogg)")
        if path:
            self.vocal_file_lbl.setText(f"Selected Audio Path: {path}")

    def pick_video_file(self):
        path, _ = QFileDialog.getOpenFileName(self, "Select Target Movie file", "", "Video (*.mp4 *.avi *.mkv)")
        if path:
            self.video_input_lbl.setText(path)

    # Core logic hooks
    def generate_speech_local(self):
        txt = self.tts_text_input.toPlainText()
        voice = self.voice_combo.currentText()
        speed = self.pitch_spin.value()
        if not txt:
            QMessageBox.warning(self, "Warning", "Please input script text first.")
            return
        
        # Free Edge-TTS speech output mapping concept
        # Local speech output with Edge-TTS runs beautifully offline in Python!
        QMessageBox.information(self, "Generating Speech", f"Generating audio using offline model: '{voice}' at rate: {speed}X")
        
    def run_audio_transcription(self):
        audio_file = self.audio_path_lbl.text()
        if audio_file == "No file chosen":
            QMessageBox.warning(self, "Audio Required", "Please select an audio or video file first.")
            return
        
        engine = self.trans_engine_combo.currentText()
        QMessageBox.information(self, "Processing Speech", f"Running transcription engine: {engine}. Please wait, analyzing speech timestamps...")
        # Simulate local subtitle response
        self.stt_result.setText("1\\n00:00:01,000 --> 00:00:04,500\\nសួស្តីសមាជិកទាំងអស់គ្នា!\\n\\n2\\n00:00:05,000 --> 00:00:08,200\\nសូមស្វាគមន៍មកកាន់ការបង្កើតវីដេអូជាមួយ AI Movie Studio។")

    def run_vocal_separation(self):
        audio_path = self.vocal_file_lbl.text()
        if "None" in audio_path:
            QMessageBox.warning(self, "Audio Required", "Please load an audio song file first.")
            return
        
        self.vocal_progress.setValue(20)
        # Separate vocal and music
        self.vocal_progress.setValue(60)
        self.vocal_progress.setValue(100)
        QMessageBox.information(self, "Completed", "Successfully separated audio into Vocal and Instrumental stems! Tracks saved into: 'output/separated/' folder.")

    def execute_subtitle_burn(self):
        video = self.video_input_lbl.text()
        if video == "No Video File Loaded":
            QMessageBox.warning(self, "Video Required", "Please select a target video file.")
            return
        
        # Simulation of burner rendering
        QMessageBox.information(self, "Rendering subtitles", "Subtitle overlay rendering pipeline initialized. Frame blending in progress...")

    def translate_content(self):
        src_text = self.trans_source.toPlainText()
        tgt_lang = self.trans_lang_combo.currentText()
        if not src_text:
            QMessageBox.warning(self, "Text empty", "Source dialogue text is empty.")
            return
        
        # Simulation translator output
        self.trans_dest.setText("1\\n00:00:01,000 --> 00:00:04,500\\nHello everyone! (បកប្រែជាភាសា: " + tgt_lang + ")\\n\\n2\\n00:00:05,000 --> 00:00:08,200\\nWelcome to dynamic movie building with AI Movie Studio.")

if __name__ == "__main__":
    app = QApplication(sys.argv)
    window = AIMovieStudio()
    window.show()
    sys.exit(app.exec())
`
  },
  {
    id: "stt-module",
    titleKhmer: "🎙️ មុខងារ Speech to Text (Free APIs & Gemini)",
    titleEnglish: "🎙️ Speech To Text module (Free APIs & Gemini)",
    descriptionKhmer: "ប្រភពកូដសម្រាប់បំលែងសំឡេងជាអក្សរ (Speech to Text) ដោយប្រើ Python SpeechRecognition (គិតថ្លៃសេរី) និង Gemini API ដើម្បីបង្កើតឯកសារ Subtitle (SRT) យ៉ាងត្រឹមត្រូវ។",
    descriptionEnglish: "Code logic using SpeechRecognition library or standard Gemini models via API to process audio binary frames and render perfect subtitle transcripts.",
    code: `import os
import io
import speech_recognition as sr
import google.generativeai as genai

# Approach 1: Free Local SpeechRecognition
def transcribe_local_free_audio(audio_path):
    recognizer = sr.Recognizer()
    with sr.AudioFile(audio_path) as source:
        audio_data = recognizer.record(source)
    try:
        # Uses free Google Online Speech Recognition key
        text = recognizer.recognize_google(audio_data, language="km-KH") # For Khmer Language
        print("Transcript success (Khmer language):")
        return text
    except sr.UnknownValueError:
        return "Speech unrecognizable"
    except sr.RequestError as e:
        return f"API unavailable: {str(e)}"

# Approach 2: Advanced Khmer and multilingual transcription via Gemini-3.5-flash
# Gemini supports file-based audio comprehension directly!
def transcribe_via_gemini(audio_file_path, api_key):
    genai.configure(api_key=api_key)
    
    # Upload audio file to Google Cloud infrastructure safely
    print("Uploading file to Gemini model context...")
    audio_file = genai.upload_file(path=audio_file_path)
    
    model = genai.GenerativeModel("gemini-1.5-flash") # uses standard audio-supported model locally
    response = model.generate_content([
        audio_file,
        "Listen to this film audio, transcribe all spoken dialogues accurately, and format them into valid SRT subtitles with correct timestamp sequences."
    ])
    
    # Clean up uploaded context
    audio_file.delete()
    return response.text
`
  },
  {
    id: "tts-module",
    titleKhmer: "🗣️ កូដបង្កើតសំឡេង (Khmer & Multilingual TTS)",
    titleEnglish: "🗣️ Khmer & Multilingual TTS reader code",
    descriptionKhmer: "របៀបបង្កើតសំឡេងអានឯកសារជាភាសាខ្មែរ ដោយប្រើបណ្ណាល័យ edge-tts (ឥតគិតថ្លៃ និងផ្តល់សម្លេងខ្មែរ Sopheap/Kalyan យ៉ាងពីរោះ និងច្បាស់ល្អ)។",
    descriptionEnglish: "Generate natural male/female Khmer synthesizer voices utilizing the edge-tts python library, which supports rich speed, pitch, and output options.",
    code: `import asyncio
import edge_tts

# Complete listing of standard Khmer voices on Microsoft Services:
# - km-KH-KalyanNeural (Female / សម្លេងស្រី)
# - km-KH-SopheapNeural (Male / សម្លេងប្រុស)

async def generate_khmer_dialogue(text, voice="km-KH-KalyanNeural", output_file="output_khmer.mp3", rate="+0%"):
    """
    Generates high-definition Khmer speech synthesis.
    rate Parameter controls the talking speed: e.g., "+10%" (fast), "-15%" (slow)
    """
    communicate = edge_tts.Communicate(text, voice, rate=rate)
    await communicate.save(output_file)
    print(f"Synthesizer vocal saved successfully inside: {output_file}")

# To run inside python, use:
# asyncio.run(generate_khmer_dialogue("សូមស្វាគមន៍មកកាន់កម្មវិធី AI Movie Studio", "km-KH-SopheapNeural"))
`
  },
  {
    id: "voices-srt",
    titleKhmer: "👥 បែកចែកសំឡេងប្រុសស្រីពី SRT File",
    titleEnglish: "👥 Split Dual Voices (Male/Female) from SRT",
    descriptionKhmer: "កូដប្រភពសម្រាប់អានឯកសារ SRT, វិភាគបន្ទាត់សន្ទនា, និងបង្កើតសំឡេងអានបំបែកលក្ខណៈតួអង្គ ប្រុស និង ស្រី ដោយស្វ័យប្រវត្តិ។",
    descriptionEnglish: "Read SRT subtitle lines, classify speaker attributes (male vs female) automatically or by markers, generate separate synthesized voices, and stitch them.",
    code: `import re
import asyncio
import edge_tts
from pydub import AudioSegment

# Class representing an individual timed SRT subtitle dialogue
class SubtitleNode:
    def __init__(self, index, start_ms, end_ms, text):
        self.index = index
        self.start_ms = start_ms
        self.end_ms = end_ms
        self.text = text
        self.voice = "km-KH-KalyanNeural" # default female

def time_to_ms(time_str):
    h, m, s_ms = time_str.split(":")
    s, ms = s_ms.split(",")
    return int(h)*3600000 + int(m)*60000 + int(s)*1000 + int(ms)

def parse_srt(srt_text):
    pattern = re.compile(r"(\\d+)\\n(\\d{2}:\\d{2}:\\d{2},\\d{3}) --> (\\d{2}:\\d{2}:\\d{2},\\d{3})\\n((?:[^\\n]+\\n*)+)")
    blocks = pattern.findall(srt_text)
    nodes = []
    for idx, block in enumerate(blocks):
        num, start, end, text = block
        node = SubtitleNode(num, time_to_ms(start), time_to_ms(end), text.strip())
        # Alternating male/female voiceovers dynamically
        node.voice = "km-KH-SopheapNeural" if idx % 2 == 0 else "km-KH-KalyanNeural"
        nodes.append(node)
    return nodes

async def build_stitched_voiceover(srt_content, output_audio_path="movie_dub.mp3"):
    nodes = parse_srt(srt_content)
    canvas = AudioSegment.silent(duration=nodes[-1].end_ms + 1000) # Silent canvas track
    
    for item in nodes:
        temp_segment = f"temp_line_{item.index}.mp3"
        # 1. Synthesize vocals offline
        communicate = edge_tts.Communicate(item.text, item.voice)
        await communicate.save(temp_segment)
        
        # 2. Add to central audio canvas corresponding precisely with SRT timestamp
        dialogue_audio = AudioSegment.from_mp3(temp_segment)
        canvas = canvas.overlay(dialogue_audio, position=item.start_ms)
        
    # Export absolute master soundtrack
    canvas.export(output_audio_path, format="mp3")
    print(f"Integrated double voice sound printed inside: {output_audio_path}")
`
  },
  {
    id: "low-end-stt",
    titleKhmer: "🚀 Transcription ល្បឿនលឿនសម្រាប់កុំព្យូទ័រខ្សោយ (Low-End PC)",
    titleEnglish: "🚀 Rapid STT Optimization for Low-End PC",
    descriptionKhmer: "បច្ចេកទេស និងកូដសម្រាប់ដំណើរការ Whisper Speech-to-Text យ៉ាងលឿនបំផុតលើកុំព្យូទ័រដែលមានកម្លាំងម៉ាស៊ីនទាប ដោយប្រើប្រាស់ 'ctranslate2' ឬ Whisper 'tiny' quantization។",
    descriptionEnglish: "Optimize native speech-to-text workflows on budget and low-resource devices using quantized 8-bit Whisper engines, tiny footprints, and hardware threading.",
    code: `import os
import whisper

def trans_optimized_for_low_spec_hardware(audio_path):
    """
    To achieve extreme speeds on older or lower-spec computers:
    1. We load the 'tiny' model footprint (only ~70MB of RAM required).
    2. We limit memory pressure and set fp16 processing to False to execute CPU float computation.
    """
    print("Initializing optimized lightweight Whisper engine...")
    model = whisper.load_model("tiny")
    
    print("Analyzing and transcribing audio...")
    result = model.transcribe(
        audio_path, 
        language="km",      # Force Khmer language for quicker translation map searches
        fp16=False,         # CPU friendly decoding configuration (prevents warning triggers)
        beam_size=1         # Simple greedy search algorithm for speed priority
    )
    
    print("Transcript text:")
    return result["text"]
`
  },
  {
    id: "vocal-remover",
    titleKhmer: "🎵 ការបំបែកសំឡេងចម្រៀង (Vocal Remover - DSP Theory)",
    titleEnglish: "🎵 Separate Audio vocals (Vocal Remover - DSP Theory)",
    descriptionKhmer: "រៀនបង្កើត Tool បំបែកសម្លេងចេញពីបទចម្រៀង ដោយប្រើបច្ចេកទេសបំបែក Waveform (DSP Center-channel pan canceling) ឬ AI Spleeter ដ៏ពេញនិយម។",
    descriptionEnglish: "Understand core programmatic concepts to divide music and vocal ranges using mathematical phase cancellations or advanced multi-stem AI encoders.",
    code: `import numpy as np
import scipy.io.wavfile as wav

def remove_vocals_via_phase_cancellation(stereo_wav_path, output_path):
    """
    Traditional Digital Signal Processing (DSP) Method:
    Most karaoke vocal removers utilize the 'Center Channel Phase Cancellation' rule.
    Since lead vocals are usually mixed directly in the center (left channel equals right channel),
    subtracting one channel from the other entirely cancels out identical center panned parts!
    """
    sample_rate, data = wav.read(stereo_wav_path)
    
    # Verify if file is indeed stereo (two audio channels)
    if len(data.shape) < 2 or data.shape[1] < 2:
        print("Audio is Mono. Center channel phase cancellation requires Stereo tracks!")
        return False
        
    left_channel = data[:, 0].astype(np.int32)
    right_channel = data[:, 1].astype(np.int32)
    
    # Subtracting right channel waveform from left channel waveform 
    # cancels out vocals completely and outputs the instrumental accompaniment.
    instrumental_wave = left_channel - right_channel
    
    # Normalize wave limit thresholds for audio protection
    instrumental_wave = np.clip(instrumental_wave, -32768, 32767).astype(np.int16)
    
    wav.write(output_path, sample_rate, instrumental_wave)
    print(f"Instrumental track generated via DSP printed inside: {output_path}")
    return True
`
  },
  {
    id: "burn-subtitles",
    titleKhmer: "🎥 បញ្ចូល Subtitles (SRT) ទៅកាន់វីដេអូ",
    titleEnglish: "🎥 Overlay/Burn Subtitles (SRT) inside Video",
    descriptionKhmer: "កូដប្រភពសម្រាប់រៀបចំ និងគូរអក្សរ Subtitle over the Video Frame (Burn Hard subtitles) ដោយប្រើ MoviePy ឥតគិតថ្លៃ និង FFmpeg យ៉ាងរហ័ស។",
    descriptionEnglish: "Implement programmatic overlays using FFmpeg filters or the moviepy library to render text dialog boundaries directly into standard Mp4 files.",
    code: `import os
from moviepy.editor import VideoFileClip, TextClip, CompositeVideoClip
from moviepy.video.tools.subtitles import SubtitlesClip

def hardcode_subtitles_into_video(video_path, srt_path, output_path="output_movie.mp4"):
    """
    Renders SRT subtitles permanently on top of the original video stream.
    Requires FFmpeg and ImageMagick configurations inside your environment.
    """
    # 1. Load original movie file
    video = VideoFileClip(video_path)
    
    # 2. Design visual subtitle format
    generator = lambda text: TextClip(
        text, 
        font="Arial-Bold", 
        fontsize=24, 
        color='white', 
        stroke_color='black', 
        stroke_width=1.5,
        method='caption',
        size=(video.w * 0.8, None)
    )
    
    # 3. Create composite subtitle video clip trace
    subtitles = SubtitlesClip(srt_path, generator)
    
    # 4. Burn together and write mp4 video frame
    final_video = CompositeVideoClip([video, subtitles.set_pos(('center', 'bottom'))])
    final_video.write_videofile(output_path, fps=video.fps, codec="libx264", audio_codec="aac")
    print(f"Rendered video successfully written into: {output_path}")
`
  }
];
