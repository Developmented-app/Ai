import React, { useState, useRef, useEffect } from "react";
import { 
  Play, Pause, Plus, Trash2, Download, Upload, Cpu, Languages, 
  Volume2, Mic, Music, Video, Copy, Check, FileText, ChevronRight,
  Sparkles, RefreshCw, HelpCircle, Film, Settings, Sliders
} from "lucide-react";
import { initialSubtitles, sampleAudios } from "./sampleData";
import { pyqtCodeTemplates } from "./pyqtCodeTemplates";
import { Subtitle, ActiveTab } from "./types";

export default function App() {
  // Navigation State
  const [activeTab, setActiveTab] = useState<ActiveTab>("studio");
  
  // App-wide Notification/Status Panel
  const [alertMsg, setAlertMsg] = useState<{ text: string; type: "success" | "error" | "info" } | null>({
    text: "សូមស្វាគមន៍មកកាន់ AI Movie Studio! មុខងារ AI ទាំងអស់ដំណើរការតាមរយៈ Gemini API server-side។",
    type: "info"
  });

  // State representing subtitles (loaded from localStorage if possible)
  const [subtitles, setSubtitles] = useState<Subtitle[]>(() => {
    try {
      const saved = localStorage.getItem("ai_movie_studio_subtitles");
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error("Failed to load subtitles from localStorage", e);
    }
    return initialSubtitles;
  });
  const [selectedSubId, setSelectedSubId] = useState<string>("sub-1");
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);

  // Auto-save State and Effect
  const [lastSaved, setLastSaved] = useState<string | null>(() => {
    return localStorage.getItem("ai_movie_studio_last_saved") || null;
  });

  useEffect(() => {
    const handler = setTimeout(() => {
      try {
        localStorage.setItem("ai_movie_studio_subtitles", JSON.stringify(subtitles));
        const now = new Date();
        const timeStr = now.toLocaleTimeString();
        localStorage.setItem("ai_movie_studio_last_saved", timeStr);
        setLastSaved(timeStr);
      } catch (e) {
        console.error("Error saving subtitles to localStorage", e);
      }
    }, 1500); // Save inside a debounce handler

    return () => clearTimeout(handler);
  }, [subtitles]);
  
  // RAW SRT import/export states
  const [rawSrtText, setRawSrtText] = useState<string>("");
  const [showRawEditor, setShowRawEditor] = useState<boolean>(false);

  // --- Bulk Selection State ---
  const [bulkSelectedIds, setBulkSelectedIds] = useState<string[]>([]);
  const [shiftTimeValue, setShiftTimeValue] = useState<string>("1000");

  // --- TTS State ---
  const [ttsText, setTtsText] = useState<string>("សូមស្វាគមន៍បងប្អូនទាំងអស់គ្នា មកកាន់កម្មវិធីបង្កើតកុនវៃឆ្លាត cambodian ai studio");
  const [ttsVoice, setTtsVoice] = useState<string>("Kore"); // 'Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr'
  const [ttsSpeakerGender, setTtsSpeakerGender] = useState<"male" | "female">("female");
  const [ttsSpeed, setTtsSpeed] = useState<string>("normal");
  const [ttsAudioUrl, setTtsAudioUrl] = useState<string | null>(null);
  const [isGeneratingTts, setIsGeneratingTts] = useState<boolean>(false);
  const ttsPlayerRef = useRef<HTMLAudioElement | null>(null);

  // --- STT (Speech to Text) State ---
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingTime, setRecordingTime] = useState<number>(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isTranscribing, setIsTranscribing] = useState<boolean>(false);
  const [sttPrompt, setSttPrompt] = useState<string>("Listen contextually to this Cambodian / Khmer dialogue audio, transcribe it precisely, and return valid SRT subtitles.");
  const [selectedSampleAudioId, setSelectedSampleAudioId] = useState<string>("");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingTimerRef = useRef<any>(null);

  // --- Multi Voiceover Synthesizer State ---
  const [isSynthesizingDub, setIsSynthesizingDub] = useState<boolean>(false);
  const [dubbingProgress, setDubbingProgress] = useState<number>(0);
  const [dubAudioUrl, setDubAudioUrl] = useState<string | null>(null);

  // --- Translation State ---
  const [targetTranslationLang, setTargetTranslationLang] = useState<string>("Khmer");
  const [isTranslating, setIsTranslating] = useState<boolean>(false);

  // --- Vocal Remover Simulator State ---
  const [vocalVolume, setVocalVolume] = useState<number>(100);
  const [musicVolume, setMusicVolume] = useState<number>(100);
  const [selectedSongName, setSelectedSongName] = useState<string>("របាំទេពអប្សរ_Vocal_Mix.mp3");
  const [vocalStatusMsg, setVocalStatusMsg] = useState<string>("Loaded stereo master audio file.");
  const [isSeparated, setIsSeparated] = useState<boolean>(false);
  const [isSeparating, setIsSeparating] = useState<boolean>(false);

  // --- Video Subtitle Burner Overlays state ---
  const [videoBackPlaneColor, setVideoBackPlaneColor] = useState<string>("linear-gradient(to bottom, #101014, #050508)");
  const [subFontSize, setSubFontSize] = useState<number>(18);
  const [subFontColor, setSubFontColor] = useState<string>("#ffffff");
  const [subBgOpacity, setSubBgOpacity] = useState<number>(60);
  const [subFontWeight, setSubFontWeight] = useState<string>("600");
  const [playingVideoSim, setPlayingVideoSim] = useState<boolean>(false);
  const [videoPlayTimeMs, setVideoPlayTimeMs] = useState<number>(0);
  const videoIntervalRef = useRef<any>(null);

  // Python Code selected ID
  const [selectedCodeTemplateId, setSelectedCodeTemplateId] = useState<string>("full-app");

  // Load RAW Subtitles representation
  useEffect(() => {
    generateRawSrtFromState();
  }, [subtitles]);

  // Audio recording timer loop
  useEffect(() => {
    if (isRecording) {
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } else {
      clearInterval(recordingTimerRef.current);
      setRecordingTime(0);
    }
    return () => clearInterval(recordingTimerRef.current);
  }, [isRecording]);

  // Auto clean alert after 8 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setAlertMsg(null);
    }, 12000);
    return () => clearTimeout(timer);
  }, [alertMsg]);

  // Video Simulator time scheduler
  useEffect(() => {
    if (playingVideoSim) {
      videoIntervalRef.current = setInterval(() => {
        setVideoPlayTimeMs(prev => {
          const nextVal = prev + 100;
          if (nextVal > 15000) { // loop after 15 seconds
            return 0;
          }
          return nextVal;
        });
      }, 100);
    } else {
      clearInterval(videoIntervalRef.current);
    }
    return () => clearInterval(videoIntervalRef.current);
  }, [playingVideoSim]);

  const activeSubtitleInVideoSim = subtitles.find(sub => {
    const startMs = parseTimeToMs(sub.startTime);
    const endMs = parseTimeToMs(sub.endTime);
    return videoPlayTimeMs >= startMs && videoPlayTimeMs <= endMs;
  });

  function parseTimeToMs(timeStr: string): number {
    try {
      // 00:00:01,200 -> ms
      const parts = timeStr.trim().split("-->");
      const target = parts[0] ? parts[0].trim() : timeStr.trim();
      const match = target.match(/(\d{2}):(\d{2}):(\d{2})[,\.](\d{3})/);
      if (match) {
        const hrs = parseInt(match[1]);
        const mins = parseInt(match[2]);
        const secs = parseInt(match[3]);
        const ms = parseInt(match[4]);
        return (hrs * 3600 + mins * 60 + secs) * 1000 + ms;
      }
    } catch (e) {
      console.error(e);
    }
    return 0;
  }

  function formatMsToSrtTime(totalMs: number): string {
    const hrs = Math.floor(totalMs / 3600000);
    const mins = Math.floor((totalMs % 3600000) / 60000);
    const secs = Math.floor((totalMs % 60000) / 1000);
    const ms = totalMs % 1000;
    const pad = (num: number, szNum: number) => String(num).padStart(szNum, "0");
    return `${pad(hrs, 2)}:${pad(mins, 2)}:${pad(secs, 2)},${pad(ms, 3)}`;
  }

  // 1. Generate SRT raw content
  function generateRawSrtFromState() {
    const text = subtitles.map((sub, idx) => {
      return `${idx + 1}\n${sub.startTime} --> ${sub.endTime}\n${sub.text}`;
    }).join("\n\n");
    setRawSrtText(text);
  }

  // Parse raw SRT block input
  function applyRawSrtToState() {
    try {
      const pattern = /(\d+)\n(\d{2}:\d{2}:\d{2}[,\.]\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2}[,\.]\d{3})\n((?:[^\n]+\n*)+)/g;
      const matchedArray = [...rawSrtText.matchAll(pattern)];
      if (matchedArray.length === 0) {
        setAlertMsg({ text: "ទម្រង់ SRT មិនត្រឹមត្រូវឡើយ! សូមពិនិត្យទម្រង់ពេលវេលា និងលំដាប់ឡើងវិញ។", type: "error" });
        return;
      }

      const generatedSubs: Subtitle[] = matchedArray.map((match, idx) => ({
        id: `imported-${idx}-${Date.now()}`,
        index: idx + 1,
        startTime: match[2].replace(".", ","),
        endTime: match[3].replace(".", ","),
        text: match[4].trim(),
        speaker: idx % 2 === 0 ? "female" : "male"
      }));

      setSubtitles(generatedSubs);
      setAlertMsg({ text: `បានបញ្ចូល និងឆ្លងកាត់ Subtitles ចំនួន ${generatedSubs.length} ជោគជ័យ!`, type: "success" });
      setShowRawEditor(false);
    } catch (err: any) {
      setAlertMsg({ text: `បញ្ហាកាសរសេរកូដបញ្ចូល: ${err.message}`, type: "error" });
    }
  }

  // Add a new row to grid editor
  function handleAddSubtitleRow() {
    const nextIdx = subtitles.length + 1;
    let newStartTime = "00:00:10,000";
    let newEndTime = "00:00:14,000";

    if (subtitles.length > 0) {
      const lastSub = subtitles[subtitles.length - 1];
      const endMs = parseTimeToMs(lastSub.endTime);
      newStartTime = formatMsToSrtTime(endMs + 1000);
      newEndTime = formatMsToSrtTime(endMs + 5000);
    }

    const newSub: Subtitle = {
      id: `custom-sub-${Date.now()}`,
      index: nextIdx,
      startTime: newStartTime,
      endTime: newEndTime,
      text: "បន្ទាត់សន្ទនាថ្មីសម្រួលដោយ AI Movie Tool...",
      speaker: nextIdx % 2 === 0 ? "male" : "female"
    };

    setSubtitles([...subtitles, newSub]);
    setSelectedSubId(newSub.id);
  }

  function handleDeleteSubtitleRow(id: string) {
    const filtered = subtitles.filter(sub => sub.id !== id);
    const updated = filtered.map((sub, index) => ({
      ...sub,
      index: index + 1
    }));
    setSubtitles(updated);
    // Cleanup reference in bulk options
    setBulkSelectedIds(prev => prev.filter(item => item !== id));
    if (selectedSubId === id && updated.length > 0) {
      setSelectedSubId(updated[0].id);
    }
  }

  function handleUpdateSubtitleField(id: string, field: keyof Subtitle, value: any) {
    setSubtitles(subtitles.map(sub => {
      if (sub.id === id) {
        return { ...sub, [field]: value };
      }
      return sub;
    }));
  }

  function handleToggleBulkSelect(id: string) {
    setBulkSelectedIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  }

  function handleToggleSelectAll() {
    if (bulkSelectedIds.length === subtitles.length) {
      setBulkSelectedIds([]);
    } else {
      setBulkSelectedIds(subtitles.map(sub => sub.id));
    }
  }

  function handleDeleteBulkSelected() {
    if (bulkSelectedIds.length === 0) {
      setAlertMsg({ text: "សូមជ្រើសរើសបន្ទាត់ Subtitle ជាមុនសិន!", type: "error" });
      return;
    }
    const filtered = subtitles.filter(sub => !bulkSelectedIds.includes(sub.id));
    const updated = filtered.map((sub, index) => ({
      ...sub,
      index: index + 1
    }));
    setSubtitles(updated);
    setBulkSelectedIds([]);
    setAlertMsg({ text: `បានលុបបន្ទាត់ដែលបានជ្រើសរើសចំនួន ${bulkSelectedIds.length} ជោគជ័យ!`, type: "success" });
  }

  function handleShiftSelectedTime(msOffset: number) {
    if (bulkSelectedIds.length === 0) {
      setAlertMsg({ text: "សូមជ្រើសរើសបន្ទាត់ Subtitle ដែលចង់ផ្លាស់ប្តូរពេលវេលា!", type: "error" });
      return;
    }
    const updated = subtitles.map(sub => {
      if (bulkSelectedIds.includes(sub.id)) {
        const startMs = parseTimeToMs(sub.startTime);
        const endMs = parseTimeToMs(sub.endTime);
        const newStartMs = Math.max(0, startMs + msOffset);
        const newEndMs = Math.max(0, endMs + msOffset);
        return {
          ...sub,
          startTime: formatMsToSrtTime(newStartMs),
          endTime: formatMsToSrtTime(newEndMs)
        };
      }
      return sub;
    });
    setSubtitles(updated);
    setAlertMsg({ 
      text: `បានផ្លាស់ប្តូរពេលវេលា (${msOffset > 0 ? "+" : ""}${msOffset / 1000}s) លើ Subtitles ចំនួន ${bulkSelectedIds.length} ជោគជ័យ!`, 
      type: "success" 
    });
  }

  // SRT file downloader Helper
  function handleDownloadSrtFile() {
    const blob = new Blob([rawSrtText], { type: "text/srt;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "ai_movie_studio_subtitles.srt");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setAlertMsg({ text: "បានទាញយកឯកសារ Subtitle (SRT) ទៅកាន់ម៉ាស៊ីនរួចរាល់!", type: "success" });
  }

  // 2. Play Audio Text to Speech via Gemini API 
  async function generateTtsSpeech() {
    if (!ttsText.trim()) {
      setAlertMsg({ text: "សូមមេត្តាបញ្ចូលអត្ថបទអានជាមុនសិន!", type: "error" });
      return;
    }
    setIsGeneratingTts(true);
    setTtsAudioUrl(null);
    try {
      // Map speaker configuration
      const response = await fetch("/api/gemini/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: ttsText,
          voiceName: ttsVoice,
          promptStyle: `Pronounce naturally like a professional cinema trailer naration. Render voice as gender ${ttsSpeakerGender} speaking at ${ttsSpeed} speed.`
        })
      });

      if (!response.ok) {
        const errJson = await response.json();
        throw new Error(errJson.error || "Failed server TTS generation.");
      }

      const data = await response.json();
      if (data.audio) {
        // Convert base64 data to source audio URL
        const audioSrc = `data:audio/mp3;base64,${data.audio}`;
        setTtsAudioUrl(audioSrc);
        setAlertMsg({ text: "សំឡេងអានរបស់តួអង្គ AI ត្រូវបានបង្កើតជោគជ័យ!", type: "success" });
      }
    } catch (err: any) {
      console.error(err);
      setAlertMsg({ 
        text: `បរាជ័យក្នុងការបង្កើតសំឡេង (TTS): ${err.message}. ព័ត៌មានជំនួយ: សូមទាញយកកូដ Python PyQt6 ក្នុង Tab 'កូដកម្មវិធី Python PyQt6' សម្រាប់ដំណើរការ edge-tts ដោយឥតគិតថ្លៃដោយគ្មានដែនកំណត់!`, 
        type: "error" 
      });
    } finally {
      setIsGeneratingTts(false);
    }
  }

  // 3. Dual voiceover stitching engine simulation
  function playDualSrtVoiceover() {
    if (subtitles.length === 0) {
      setAlertMsg({ text: "គ្មានទិន្នន័យ Subtitle សម្រាប់បង្កើតសំឡេងឡើយ។", type: "error" });
      return;
    }
    
    setIsSynthesizingDub(true);
    setDubbingProgress(5);
    setDubAudioUrl(null);

    // Simulate timing stages of generating voiceovers for all rows
    const interval = setInterval(() => {
      setDubbingProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsSynthesizingDub(false);
          // Play a friendly simulated stitched audio combining female (Kalyan) and male (Sopheap) standard lines
          setDubAudioUrl("https://actions.google.com/sounds/v1/science_fiction/teleport.ogg");
          setAlertMsg({ text: "បានគណនា និងរក្សាទុកសំឡេងតួអង្គចម្រុះប្រុសស្រីស្របគ្នាជាមួយ SRT timeline ជោគជ័យ!", type: "success" });
          return 100;
        }
        return prev + 15;
      });
    }, 400);
  }

  // 4. Translate Active Subtitle array with Gemini API
  async function translateSrtActive() {
    setIsTranslating(true);
    try {
      const response = await fetch("/api/gemini/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: rawSrtText,
          targetLang: targetTranslationLang
        })
      });

      if (!response.ok) {
        const errJson = await response.json();
        throw new Error(errJson.error);
      }

      const data = await response.json();
      if (data.translatedText) {
        // Parse the translated result back into the SRT structure
        setRawSrtText(data.translatedText);
        setAlertMsg({ text: `បានបកប្រែ Subtitles ទាំងអស់ទៅជាភាសា ${targetTranslationLang} ដោយប្រើ Gemini AI!`, type: "success" });
        
        // Auto convert raw txt output back into subtitle instances
        setTimeout(() => {
          try {
            const pattern = /(\d+)\n(\d{2}:\d{2}:\d{2}[,\.]\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2}[,\.]\d{3})\n((?:[^\n]+\n*)+)/g;
            const matchedArray = [...data.translatedText.matchAll(pattern)];
            if (matchedArray.length > 0) {
              const generatedSubs = matchedArray.map((match: any, idx: number) => ({
                id: `trans-${idx}-${Date.now()}`,
                index: idx + 1,
                startTime: match[2].replace(".", ","),
                endTime: match[3].replace(".", ","),
                text: match[4].trim(),
                speaker: idx % 2 === 0 ? "female" : "male" as any
              }));
              setSubtitles(generatedSubs);
            }
          } catch (e) {
            console.warn("Soft parse failed", e);
          }
        }, 50);
      }
    } catch (err: any) {
      console.error(err);
      setAlertMsg({ text: `ការបកប្រែមានកំហុស: ${err.message}`, type: "error" });
    } finally {
      setIsTranslating(false);
    }
  }

  // 5. STT Transcription handling
  async function handleAudioUploadAndTranscribe(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsTranscribing(true);
    setAlertMsg({ text: "កំពុងអានទិន្នន័យឯកសារសំឡេង ដើម្បីបញ្ជូនទៅកាន់ Gemini 3.5 API...", type: "info" });

    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        const base64Content = reader.result?.toString().split(",")[1];
        if (!base64Content) {
          throw new Error("Cannot decode file representation as Base64 format.");
        }

        // Send to api transcribe route
        const response = await fetch("/api/gemini/transcribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            audioBase64: base64Content,
            mimeType: file.type || "audio/mp3",
            prompt: sttPrompt
          })
        });

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.error || "Gemini service encountered errors processing this sound stream.");
        }

        const data = await response.json();
        if (data.srt) {
          setRawSrtText(data.srt);
          setAlertMsg({ text: "បម្លែងសំឡេងជាអក្សរជោគជ័យ! Subtitles ថ្មីត្រូវបានបញ្ចូលទៅក្នុង Editor។", type: "success" });
          
          // Apply raw SRT parser automatically
          setTimeout(() => {
            const pattern = /(\d+)\n(\d{2}:\d{2}:\d{2}[,\.]\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2}[,\.]\d{3})\n((?:[^\n]+\n*)+)/g;
            const matchedArray = [...data.srt.matchAll(pattern)];
            if (matchedArray.length > 0) {
              const generatedSubs = matchedArray.map((match: any, idx: number) => ({
                id: `stt-${idx}-${Date.now()}`,
                index: idx + 1,
                startTime: match[2].replace(".", ","),
                endTime: match[3].replace(".", ","),
                text: match[4].trim(),
                speaker: idx % 2 === 0 ? "female" : "male" as any
              }));
              setSubtitles(generatedSubs);
            }
          }, 30);
        }
      };
    } catch (err: any) {
      console.error(err);
      setAlertMsg({ text: `បញ្ហាបំលែងសំឡេងជាអក្សរ: ${err.message}`, type: "error" });
    } finally {
      setIsTranscribing(false);
    }
  }

  // Microphone recording functions
  async function startRecordingMic() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      const audioChunks: Blob[] = [];
      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: "audio/mp3" });
        setAudioBlob(audioBlob);
        setAlertMsg({ text: "ថតសំឡេងចប់សព្វគ្រប់! ចុច 'បម្លែងសំឡេងថតជាអក្សរ' ដើម្បីដំណើរការជាមួយ Gemini AI។", type: "success" });
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err: any) {
      setAlertMsg({ text: "មិនអាចទទួលបានសិទ្ធិប្រើប្រាស់មីក្រូហ្វូន: " + err.message, type: "error" });
    }
  }

  function stopRecordingMic() {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      // Stop track stream safely
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  }

  // Transcribe the manually recorded audio blob via Gemini
  async function transcribeRecordedAudio() {
    if (!audioBlob) {
      setAlertMsg({ text: "រកមិនឃើញឯកសារថតសំឡេង! សូមថតជាមុនសិន។", type: "error" });
      return;
    }

    setIsTranscribing(true);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      reader.onload = async () => {
        const base64Content = reader.result?.toString().split(",")[1];
        if (!base64Content) return;

        const response = await fetch("/api/gemini/transcribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            audioBase64: base64Content,
            mimeType: "audio/mp3",
            prompt: sttPrompt
          })
        });

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.error);
        }

        const data = await response.json();
        if (data.srt) {
          setRawSrtText(data.srt);
          setAlertMsg({ text: "Gemini AI បានបម្លែងសំឡេងថតជាអក្សរ SRT ជោគជ័យ!", type: "success" });
          
          // Render to timeline grid
          const pattern = /(\d+)\n(\d{2}:\d{2}:\d{2}[,\.]\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2}[,\.]\d{3})\n((?:[^\n]+\n*)+)/g;
          const matchedArray = [...data.srt.matchAll(pattern)];
          if (matchedArray.length > 0) {
            const generatedSubs = matchedArray.map((match: any, idx: number) => ({
              id: `stt-mic-${idx}-${Date.now()}`,
              index: idx + 1,
              startTime: match[2].replace(".", ","),
              endTime: match[3].replace(".", ","),
              text: match[4].trim(),
              speaker: idx % 2 === 0 ? "female" : "male" as any
            }));
            setSubtitles(generatedSubs);
          }
        }
      };
    } catch (err: any) {
      console.error(err);
      setAlertMsg({ text: "កំហុសក្នុងកំឡុងពេលថតចម្លង៖ " + err.message, type: "error" });
    } finally {
      setIsTranscribing(false);
    }
  }

  // Transcribe pre-saved sample audio to show functional speed even for slow devices
  function runLowEndSttBypass() {
    setIsTranscribing(true);
    setAlertMsg({ text: "កំពុងដំណើរការ STT optimized simulator សម្រាប់កុំព្យូទ័រទាប (Low Engine-tiny)...", type: "info" });
    setTimeout(() => {
      const simulatedSrt = `1\n00:00:01,000 --> 00:00:05,000\nសួស្តីបងប្អូនទាំងអស់គ្នា! នេះជាលទ្ធផលតេស្តពីម៉ាស៊ីន STT low-end លឿនបំផុត។\n\n2\n00:00:06,000 --> 00:00:10,000\nប្រព័ន្ធដំណើរការបានលឿន និងស៊ីធនធាន RAM តិចបំផុតត្រឹមតែ 70MB។`;
      setRawSrtText(simulatedSrt);
      
      const pattern = /(\d+)\n(\d{2}:\d{2}:\d{2}[,\.]\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2}[,\.]\d{3})\n((?:[^\n]+\n*)+)/g;
      const matchedArray = [...simulatedSrt.matchAll(pattern)];
      if (matchedArray.length > 0) {
        setSubtitles(matchedArray.map((match: any, idx: number) => ({
          id: `lowspec-${idx}-${Date.now()}`,
          index: idx + 1,
          startTime: match[2].replace(".", ","),
          endTime: match[3].replace(".", ","),
          text: match[4].trim(),
          speaker: idx % 2 === 0 ? "female" : "male" as any
        })));
      }
      setIsTranscribing(false);
      setAlertMsg({ text: "កូដ STT សម្រាប់ Low-End PC ត្រូវបានបង្កើតលទ្ធផលត្រាប់ជោគជ័យ!", type: "success" });
    }, 1200);
  }

  // 6. Vocal Remover simulator logic
  function handleSeparateVocalsSim() {
    setIsSeparating(true);
    setVocalStatusMsg("Running DSP Center Channel Phase Cancellation formula (L - R)...");
    
    setTimeout(() => {
      setIsSeparating(false);
      setIsSeparated(true);
      setVocalVolume(0); // vocal cancelled totally
      setMusicVolume(100); // instrumental left 
      setVocalStatusMsg("Successfully separated! Lead-vocal canceled. Playing core accompaniment background.");
      setAlertMsg({ text: "បានគណនា និងបំបែកសំឡេង (Vocal) និងភ្លេង (Instrumental) រួចរាល់!", type: "success" });
    }, 1500);
  }

  function handleResetVocals() {
    setIsSeparated(false);
    setVocalVolume(100);
    setMusicVolume(100);
    setVocalStatusMsg("Stereo master audio track reset.");
  }

  // Copy Python snippet Helper
  function handleCopyCodeSnippet(id: string, text: string) {
    navigator.clipboard.writeText(text);
    setCopiedCodeId(id);
    setAlertMsg({ text: "បានចម្លងប្រភពកូដ Python PyQt6 ទៅកាន់ Clipboard!", type: "success" });
    setTimeout(() => setCopiedCodeId(null), 3000);
  }

  // Active Subtitle row object details
  const activeSrtNode = subtitles.find(sub => sub.id === selectedSubId) || subtitles[0];

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans selection:bg-red-500 selection:text-white" id="main-studio-root">
      
      {/* Dynamic Alert Banner */}
      {alertMsg && (
        <div className={`fixed top-4 right-4 z-50 max-w-md p-4 rounded-xl shadow-2xl border flex items-start gap-3 animate-fade-in transition-all duration-300 ${
          alertMsg.type === "success" 
            ? "bg-stone-900 border-emerald-500 text-emerald-400" 
            : alertMsg.type === "error" 
            ? "bg-stone-900 border-red-500 text-red-400" 
            : "bg-stone-950 border-neutral-700 text-cyan-400"
        }`} id="app-dynamic-banner">
          <Sparkles className="h-5 w-5 shrink-0 mt-0.5 animate-pulse" />
          <div className="flex-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400">ប្រព័ន្ធ AI Studio Alert</p>
            <p className="text-sm mt-0.5 font-medium leading-relaxed">{alertMsg.text}</p>
          </div>
          <button onClick={() => setAlertMsg(null)} className="text-neutral-500 hover:text-white text-xs font-bold px-1 rounded">✕</button>
        </div>
      )}

      {/* Modern Studio Header */}
      <header className="border-b border-neutral-800 bg-neutral-900/45 backdrop-blur-md sticky top-0 z-40 px-6 py-4" id="header-bar">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          
          <div className="flex items-center gap-3">
            <div className="bg-red-500 p-2.5 rounded-lg text-white shadow-xl shadow-red-950/30">
              <Film className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-red-500/10 text-red-500 text-[10px] font-bold px-2 py-0.5 rounded-full border border-red-500/20">CAMBODIA</span>
                <span className="text-neutral-500 text-[10px] font-bold">V1.5 PRO</span>
                {lastSaved && (
                  <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-sm font-mono" id="autosave-timestamp">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    Last saved: {lastSaved}
                  </span>
                )}
              </div>
              <h1 className="text-lg font-bold tracking-tight bg-gradient-to-r from-neutral-100 via-neutral-200 to-neutral-400 bg-clip-text text-transparent">
                កម្មវិធី AI Movie Studio & PyQt6 Generator
              </h1>
            </div>
          </div>

          {/* Navigation Control Hub */}
          <div className="flex bg-neutral-950 p-1.5 rounded-xl border border-neutral-800" id="nav-hub-holder">
            <button
              id="btn-tab-studio"
              onClick={() => setActiveTab("studio")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                activeTab === "studio" 
                  ? "bg-red-500 text-white shadow-lg shadow-red-500/20" 
                  : "text-neutral-400 hover:text-white hover:bg-neutral-900"
              }`}
            >
              <Sparkles className="h-4 w-4" />
              AI Studio & HTML ធំៗ
            </button>
            <button
              id="btn-tab-pycode"
              onClick={() => setActiveTab("python-code")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                activeTab === "python-code" 
                  ? "bg-red-500 text-white shadow-lg shadow-red-500/20" 
                  : "text-neutral-400 hover:text-white hover:bg-neutral-900"
              }`}
            >
              <Cpu className="h-4 w-4" />
              កូដកម្មវិធី Python PyQt6
            </button>
          </div>

        </div>
      </header>

      {/* Main Container Wrapper */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-6 py-8" id="main-grid-canvas">
        
        {/* BANNER FOR SECRETS WARNING */}
        <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-stone-900 border border-neutral-800 text-neutral-300 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-cyan-500/10 text-cyan-400 p-2 rounded-lg border border-cyan-500/20 shrink-0">
              <Settings className="h-5 w-5 animate-spin" />
            </div>
            <div>
              <p className="text-sm font-bold text-neutral-100">គន្លឹះគន្លឹះប្រើប្រាស់ (Developer Insights)</p>
              <p className="text-xs text-neutral-400 mt-0.5">
                រាល់មុខងារ AI ទំនើបៗ គឺដំណើរការដោយស្វ័យប្រវត្តិតាមរយៈ <span className="text-cyan-400">Gemini-3.5-flash</span> (Speech to Text, Translation & Subtitles AI)។
              </p>
            </div>
          </div>
          <div className="text-xs bg-neutral-950 py-1.5 px-3 rounded-lg border border-neutral-800 text-neutral-400">
            ស្ថានភាព API: <span className="text-emerald-500 font-bold">● Server-Active</span>
          </div>
        </div>

        {/* ==================== TAB 1 STATEMENT ==================== */}
        {activeTab === "studio" && (
          <div className="space-y-8 animate-fade-in" id="workspace-studio">
            
            {/* Split panels - SRT Editor on Left, Active Controls on Right */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* Left side Subtitle SRT Engine Table */}
              <div className="lg:col-span-7 bg-neutral-900/50 border border-neutral-800/80 rounded-2xl p-5 flex flex-col gap-4 shadow-xl">
                
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-neutral-800 pb-4">
                  <div>
                    <h2 className="text-base font-bold text-neutral-100 flex items-center gap-2">
                      <FileText className="h-5 w-5 text-red-500" />
                      បញ្ជីវាយអត្ថបទរង (SRT Subtitle Timeline)
                    </h2>
                    <p className="text-xs text-neutral-400">អ្នកអាចបង្កើតរូបរាង កែប្រែពេលវេលា និងបកប្រែ Subtitle over audio ផ្ទាល់បាន។</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      id="btn-add-sub"
                      onClick={handleAddSubtitleRow}
                      className="bg-neutral-800 hover:bg-neutral-700 text-neutral-200 hover:text-white px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border border-neutral-700 transition-colors"
                    >
                      <Plus className="h-3.5 w-3.5 text-emerald-400" />
                      ថែមបន្ទាត់
                    </button>
                    <button
                      onClick={() => setShowRawEditor(!showRawEditor)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                        showRawEditor 
                          ? "bg-red-500/20 border-red-500 text-red-400" 
                          : "bg-neutral-800 border-neutral-700 text-neutral-300 hover:bg-neutral-700"
                      }`}
                    >
                      {showRawEditor ? "លាក់កូដ SRT" : "មើល / កែ SRT ផ្ទាល់"}
                    </button>
                  </div>
                </div>

                {/* Import / Export raw sub area */}
                {showRawEditor ? (
                  <div className="space-y-3 bg-neutral-950 p-4 rounded-xl border border-neutral-800 transition-all">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-amber-500">កែប្រែទម្រង់ RAW SRT File</label>
                      <span className="text-[10px] text-neutral-500">ម៉ាស៊ីននឹងផ្ទៀងផ្ទាត់ដោយស្វ័យប្រវត្ត</span>
                    </div>
                    <textarea
                      id="raw-srt-editor-textarea"
                      value={rawSrtText}
                      onChange={(e) => setRawSrtText(e.target.value)}
                      className="w-full h-80 bg-neutral-900 border border-neutral-800 rounded-lg p-3 text-mono text-xs text-emerald-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-mono leading-relaxed"
                      placeholder="e.g.&#10;1&#10;00:00:01,000 --> 00:00:04,500&#10;សួស្តីបងប្អូនទាំងអស់គ្នា..."
                    />
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => setShowRawEditor(false)}
                        className="bg-neutral-800 hover:bg-neutral-700 text-neutral-400 px-4 py-2 rounded-lg text-xs font-bold"
                      >
                        បោះបង់
                      </button>
                      <button
                        id="btn-apply-raw-srt"
                        onClick={applyRawSrtToState}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-xs font-bold shadow-lg shadow-emerald-600/10"
                      >
                        យល់ព្រមអនុវត្ត (Sync)
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Batch Actions Toolbar */}
                    {subtitles.length > 0 && (
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-neutral-950/90 border border-neutral-850 p-3 rounded-xl mb-3 shadow-md" id="batch-actions-toolbar">
                        <div className="flex items-center gap-3">
                          <input 
                            type="checkbox"
                            checked={subtitles.length > 0 && bulkSelectedIds.length === subtitles.length}
                            onChange={handleToggleSelectAll}
                            className="h-4 w-4 rounded border-neutral-750 text-red-500 focus:ring-red-550/50 bg-neutral-900 cursor-pointer"
                            id="checkbox-select-all"
                          />
                          <label htmlFor="checkbox-select-all" className="text-xs text-neutral-300 font-semibold cursor-pointer select-none">
                            {bulkSelectedIds.length > 0 
                              ? `បានជ្រើសរើស ${bulkSelectedIds.length} / ${subtitles.length} lines` 
                              : `ជ្រើសរើសទាំងអស់ (Select All)`
                            }
                          </label>
                        </div>

                        {bulkSelectedIds.length > 0 && (
                          <div className="flex flex-wrap items-center gap-2">
                            {/* Time Shifter controls */}
                            <div className="flex items-center gap-1 bg-neutral-900 border border-neutral-800 rounded-lg p-1.5 shadow-sm">
                              <span className="text-[10px] text-neutral-400 px-1 font-semibold">Shift:</span>
                              <input 
                                type="number" 
                                step="100"
                                value={shiftTimeValue}
                                onChange={(e) => setShiftTimeValue(e.target.value)}
                                className="bg-neutral-950 border border-neutral-800 rounded px-1.5 py-0.5 text-xs text-neutral-200 w-16 font-mono text-center focus:outline-none"
                                placeholder="ms"
                              />
                              <span className="text-[10px] text-neutral-500 font-mono pr-1">ms</span>
                              
                              <button
                                onClick={() => handleShiftSelectedTime(-parseFloat(shiftTimeValue || "0"))}
                                className="px-2 py-0.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded text-[10px] font-bold"
                                title="ស្រកពេលវេលា / Shift backward"
                              >
                                -
                              </button>
                              <button
                                onClick={() => handleShiftSelectedTime(parseFloat(shiftTimeValue || "0"))}
                                className="px-2 py-0.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded text-[10px] font-bold"
                                title="តម្លើងពេលវេលា / Shift forward"
                              >
                                +
                              </button>
                            </div>

                            {/* Presets */}
                            <button
                              onClick={() => handleShiftSelectedTime(1000)}
                              className="bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-[10px] text-neutral-300 px-2 py-1.5 rounded-lg font-mono"
                              title="Shift Forward by 1.0 second"
                            >
                              +1.0s
                            </button>
                            <button
                              onClick={() => handleShiftSelectedTime(-1000)}
                              className="bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-[10px] text-neutral-300 px-2 py-1.5 rounded-lg font-mono"
                              title="Shift Backward by 1.0 second"
                            >
                              -1.0s
                            </button>

                            <div className="h-4 w-[1px] bg-neutral-800 mx-1"></div>

                            {/* Delete selection */}
                            <button
                              onClick={handleDeleteBulkSelected}
                              className="bg-red-500/15 hover:bg-red-500/25 text-red-400 border border-red-500/20 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                            >
                              <Trash2 className="h-3.5 w-3.5 text-red-400" />
                              លុប ({bulkSelectedIds.length})
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Form-based timeline view rows */}
                    <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1" id="subtitles-table-rows">
                      {subtitles.length === 0 ? (
                        <div className="py-12 text-center text-neutral-500 flex flex-col items-center justify-center gap-2">
                          <FileText className="h-10 w-10 text-neutral-700 animate-pulse" />
                          <p className="text-sm">មិនទាន់មាន Subtitles នៅឡើយទេ។ សូមចុច "ថែមបន្ទាត់" ដើម្បីចាប់ផ្តើម!</p>
                        </div>
                      ) : (
                        subtitles.map((sub, idx) => (
                          <div 
                            key={sub.id} 
                            onClick={() => setSelectedSubId(sub.id)}
                            className={`p-3.5 rounded-xl border transition-all cursor-pointer relative ${
                              selectedSubId === sub.id 
                                ? "bg-neutral-800/80 border-red-500/80 shadow-md shadow-red-950/10" 
                                : "bg-neutral-950 hover:bg-neutral-920 border-neutral-800/40"
                            } ${bulkSelectedIds.includes(sub.id) ? "ring-1 ring-red-500/40 bg-neutral-900/40" : ""}`}
                          >
                            {/* Row Top actions */}
                            <div className="flex items-center justify-between gap-4 mb-2">
                              <div className="flex items-center gap-2">
                                {/* Row Checkbox */}
                                <input 
                                  type="checkbox"
                                  checked={bulkSelectedIds.includes(sub.id)}
                                  onChange={(e) => {
                                    e.stopPropagation();
                                    handleToggleBulkSelect(sub.id);
                                  }}
                                  onClick={(e) => {
                                    e.stopPropagation(); // Stop clicking checkbox from triggering active select row change
                                  }}
                                  className="h-4 w-4 rounded border-neutral-700 text-red-500 focus:ring-red-500/50 bg-neutral-950 cursor-pointer"
                                />

                                <span className="text-xs bg-neutral-800 text-neutral-400 px-2 py-0.5 rounded-md font-mono font-semibold">
                                  #{sub.index}
                                </span>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  sub.speaker === "female" ? "bg-pink-900/40 text-pink-400 border border-pink-500/20" : "bg-sky-900/40 text-sky-400 border border-sky-500/20"
                                }`}>
                                  {sub.speaker === "female" ? "👩 តួអង្គនារី (Kalyan)" : "👨 តួអង្គបុរស (Sopheap)"}
                                </span>
                              </div>
                            
                            <div className="flex items-center gap-1">
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleUpdateSubtitleField(sub.id, "speaker", sub.speaker === "female" ? "male" : "female");
                                }}
                                className="p-1 hover:bg-neutral-800 text-neutral-500 hover:text-white rounded transition-colors"
                                title="ប្តូរតួអង្គប្រុស/ស្រី"
                              >
                                <RefreshCw className="h-3 w-3" />
                              </button>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteSubtitleRow(sub.id);
                                }}
                                className="p-1 hover:bg-neutral-800 text-neutral-500 hover:text-red-400 rounded transition-colors"
                                title="លុបបន្ទាត់នេះ"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Inputs */}
                          <div className="grid grid-cols-2 gap-2 mb-2">
                            <div>
                              <span className="text-[10px] text-neutral-500 mb-0.5 block">ពេលវេលាចាប់ផ្តើម (Start)</span>
                              <input 
                                type="text"
                                value={sub.startTime}
                                onChange={(e) => handleUpdateSubtitleField(sub.id, "startTime", e.target.value)}
                                className="bg-neutral-900 border border-neutral-800 rounded px-2 py-1 text-xs text-neutral-300 w-full font-mono text-center"
                              />
                            </div>
                            <div>
                              <span className="text-[10px] text-neutral-500 mb-0.5 block">ពេលវេលាបញ្ចប់ (End)</span>
                              <input 
                                type="text"
                                value={sub.endTime}
                                onChange={(e) => handleUpdateSubtitleField(sub.id, "endTime", e.target.value)}
                                className="bg-neutral-900 border border-neutral-800 rounded px-2 py-1 text-xs text-neutral-300 w-full font-mono text-center"
                              />
                            </div>
                          </div>

                          <textarea 
                            value={sub.text}
                            onChange={(e) => handleUpdateSubtitleField(sub.id, "text", e.target.value)}
                            className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-2 text-xs text-stone-200 uppercase-control focus:outline-none focus:border-red-500 leading-relaxed font-sans"
                            rows={2}
                          />
                        </div>
                      ))
                    )}
                  </div>
                </>
              )}

                {/* Foot operations */}
                <div className="border-t border-neutral-850 pt-3.5 flex items-center justify-between gap-3 bg-neutral-900/10 -m-5 mt-2 p-5 rounded-b-2xl">
                  <div className="text-[11px] text-neutral-500">
                    សរុប: <span className="font-bold text-neutral-300">{subtitles.length} lines</span>
                  </div>
                  <button
                    id="btn-download-srt"
                    onClick={handleDownloadSrtFile}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-2 px-4 rounded-xl flex items-center gap-2 shadow-lg shadow-emerald-500/15 transition-all"
                  >
                    <Download className="h-3.5 w-3.5" />
                    ទាញយក SRT Subtitle
                  </button>
                </div>

              </div>

              {/* Right side Advanced AI Panels */}
              <div className="lg:col-span-5 flex flex-col gap-8">
                
                {/* 1. Speech-to-Text Transcribe controller */}
                <div className="bg-neutral-900 bg-opacity-40 border border-neutral-800 rounded-2xl p-5 space-y-4">
                  <div>
                    <span className="text-[10px] bg-red-500/10 text-red-400 font-bold px-2 py-0.5 rounded-full border border-red-500/20">STT ENGINE</span>
                    <h3 className="text-base font-bold text-neutral-100 mt-1 flex items-center gap-2">
                      <Mic className="h-4 w-4 text-emerald-400" />
                      បំលែងសំឡេងជាអក្សរ (Speech to Text)
                    </h3>
                    <p className="text-xs text-neutral-400">អ្នកអាចបញ្ចូលឯកសា ឬថតសំឡេងជាមួយ AI ដើម្បីបំលែងជា Subtitle ភាសាខ្មែរភ្លាមៗ។</p>
                  </div>

                  {/* Manual Audio Input Selectors */}
                  <div className="grid grid-cols-1 gap-3 bg-neutral-950 p-4 rounded-xl border border-neutral-850">
                    <div>
                      <label className="text-xs text-neutral-400 block mb-1">ជ្រើសរើស វិធីសាស្ត្របំលែង</label>
                      <select 
                        id="stt-engine-selector"
                        className="bg-neutral-900 border border-neutral-800 rounded-lg p-2 text-xs text-neutral-300 w-full focus:outline-none focus:border-cyan-500"
                        onChange={(e) => {
                          if (e.target.value === "lowspec") {
                            runLowEndSttBypass();
                          }
                        }}
                      >
                        <option value="gemini">Gemini-3.5-flash AI (អនុសាសន៍ ត្រឹមត្រូវខ្ពស់)</option>
                        <option value="lowspec">បច្ចេកទេសល្បឿនលឿនសម្រាប់ Low-End PC (Offline simulation)</option>
                      </select>
                    </div>

                    <div className="border-t border-neutral-850/50 pt-2.5">
                      <span className="text-xs text-neutral-400 font-semibold block mb-1.5">វិធីសាស្ត្រទី១៖ បញ្ចូលឯកសារពីម៉ាស៊ីន</span>
                      <div className="flex items-center justify-center border border-dashed border-neutral-700/50 hover:border-cyan-500/50 bg-neutral-900/50 rounded-xl p-4 cursor-pointer relative transition-all group">
                        <input
                          type="file"
                          accept="audio/*,video/*"
                          onChange={handleAudioUploadAndTranscribe}
                          className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                        <div className="text-center">
                          <Upload className="h-6 w-6 text-neutral-500 group-hover:text-cyan-400 mx-auto mb-1.5 transition-colors" />
                          <p className="text-[11px] text-neutral-300 group-hover:text-white transition-colors">ចុចដើម្បីជ្រើសរើសឯកសារសំឡេង ឬវីដេអូ</p>
                          <p className="text-[9px] text-neutral-500 mt-0.5">MP3 / WAV / M4A / MP4 (រហូតដល់ 50MB)</p>
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-neutral-850/50 pt-2.5">
                      <span className="text-xs text-neutral-400 font-semibold block mb-1.5">វិធីសាស្ត្រទី២៖ ថតសម្លេងសាកល្បងផ្ទាល់</span>
                      <div className="flex items-center gap-3">
                        {isRecording ? (
                          <button
                            onClick={stopRecordingMic}
                            className="bg-red-500 hover:bg-red-600 text-white font-bold text-xs py-2 px-4 rounded-lg flex items-center gap-1.5 animate-pulse shrink-0 transition-colors"
                          >
                            <span className="h-2 w-2 rounded-full bg-white block animate-ping"></span>
                            បញ្ឈប់ការថត ({recordingTime}s)
                          </button>
                        ) : (
                          <button
                            onClick={startRecordingMic}
                            className="bg-neutral-800 hover:bg-neutral-700 hover:text-white text-neutral-300 border border-neutral-700 font-bold text-xs py-2 px-4 rounded-lg flex items-center gap-1.5 shrink-0 transition-colors"
                          >
                            <Mic className="h-3.5 w-3.5 text-red-500" />
                            ចាប់ផ្តើមថត
                          </button>
                        )}

                        {audioBlob && !isRecording && (
                          <button
                            id="btn-transcribe-mic"
                            onClick={transcribeRecordedAudio}
                            className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs py-2 px-4 rounded-lg flex-1 text-center transition-colors"
                          >
                            បម្លែងសំឡេងថតជាអក្សរ
                          </button>
                        )}
                        {!audioBlob && (
                          <span className="text-[10px] text-neutral-500">សាកល្បងថតសំឡេង និងទាញអត្ថបទ</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {isTranscribing && (
                    <div className="bg-cyan-950/40 border border-cyan-800/60 rounded-xl p-3.5 text-center flex flex-col items-center justify-center gap-2 animate-pulse">
                      <RefreshCw className="h-5 w-5 text-cyan-400 animate-spin" />
                      <p className="text-xs text-cyan-300 font-medium font-sans">Gemini AI កំពុងវិភាគ និន្នាការសំឡេង និងបង្កើត Subtitle SRT code យ៉ាងត្រឹមត្រូវ...</p>
                    </div>
                  )}

                </div>

                {/* 2. Text to Speech (TTS) Reader block */}
                <div className="bg-neutral-900 bg-opacity-40 border border-neutral-800 rounded-2xl p-5 space-y-4">
                  <div>
                    <span className="text-[10px] bg-red-500/10 text-red-400 font-bold px-2 py-0.5 rounded-full border border-red-500/20">TTS SYNTHESIS</span>
                    <h3 className="text-base font-bold text-neutral-100 mt-1 flex items-center gap-2">
                      <Volume2 className="h-4 w-4 text-pink-400" />
                      បង្កើតសម្លេងអាន (Text To Speech)
                    </h3>
                    <p className="text-xs text-neutral-400">សរសេរអត្ថបទ និងបញ្ចេញសំឡេងអានជាភាសាខ្មែរ ជាមួយបច្ចេកវិទ្យា Edge / Gemini voiceover។</p>
                  </div>

                  <div className="space-y-3 bg-neutral-950 p-4 rounded-xl border border-neutral-850">
                    <div>
                      <label className="text-[11px] text-neutral-400 block mb-1">បញ្ចូលអត្ថបទអាន</label>
                      <textarea
                        value={ttsText}
                        onChange={(e) => setTtsText(e.target.value)}
                        className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-2 text-xs text-stone-200 focus:outline-none focus:border-red-500"
                        rows={3}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] text-neutral-400 block mb-1">សំឡេងជាភាសា</label>
                        <select 
                          value={ttsVoice}
                          onChange={(e) => {
                            setTtsVoice(e.target.value);
                            if (e.target.value === "Sopheap" || e.target.value === "Charon" || e.target.value === "Fenrir") {
                              setTtsSpeakerGender("male");
                            } else {
                              setTtsSpeakerGender("female");
                            }
                          }}
                          className="bg-neutral-900 border border-neutral-800 rounded-lg p-2 text-xs text-neutral-300 w-full focus:outline-none"
                        >
                          <option value="Kore">Khmer Female (Kalyan style)</option>
                          <option value="Charon">Khmer Male (Sopheap style)</option>
                          <option value="Puck">English Narrator (Kore/Puck)</option>
                          <option value="Zephyr">French Narrator</option>
                          <option value="Fenrir">Chinese Neutral Voice</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[11px] text-neutral-400 block mb-1">ល្បឿនអានសរុប</label>
                        <select 
                          value={ttsSpeed}
                          onChange={(e) => setTtsSpeed(e.target.value)}
                          className="bg-neutral-900 border border-neutral-800 rounded-lg p-2 text-xs text-neutral-300 w-full focus:outline-none"
                        >
                          <option value="slow">យឺត (-15%)</option>
                          <option value="normal">ធម្មតា (Normal)</option>
                          <option value="fast">លឿន (+20%)</option>
                        </select>
                      </div>
                    </div>

                    {/* Prebuilt Samples picker */}
                    <div className="border-t border-neutral-800 pt-3">
                      <span className="text-[10px] text-neutral-500 block mb-1.5 font-bold uppercase tracking-wider">អត្ថបទគំរូសាកល្បង</span>
                      <div className="flex flex-col gap-1.5">
                        {sampleAudios.map(aud => (
                          <button
                            key={aud.id}
                            onClick={() => {
                              setTtsText(aud.text);
                              setTtsVoice(aud.id === "epic-introduction" ? "Puck" : "Kore");
                              setTtsSpeakerGender(aud.speaker as any);
                            }}
                            className="bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 rounded text-left px-2.5 py-1.5 text-[10px] text-neutral-400 hover:text-white transition-colors flex items-center justify-between"
                          >
                            <span>{aud.label}</span>
                            <ChevronRight className="h-3 w-3" />
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Button trigger */}
                    <button
                      id="btn-voice-generate"
                      onClick={generateTtsSpeech}
                      disabled={isGeneratingTts}
                      className="w-full bg-red-600 hover:bg-red-500 disabled:bg-neutral-800 disabled:text-neutral-500 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-red-900/10 transition-colors mt-2"
                    >
                      {isGeneratingTts ? (
                        <>
                          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                          កំពុងសំយោគសំឡេង...
                        </>
                      ) : (
                        <>
                          <Volume2 className="h-4 w-4" />
                          បង្កើតសំឡេងអាន (TTS)
                        </>
                      )}
                    </button>
                  </div>

                  {/* HTML5 audio node player */}
                  {ttsAudioUrl && (
                    <div className="bg-neutral-950 p-3 rounded-xl border border-emerald-500/20 space-y-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-emerald-500/10 rounded-md text-emerald-400 border border-emerald-500/20">
                          <Check className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-neutral-100">សម្លេងអានរួចរាល់</p>
                          <p className="text-[9px] text-neutral-500 font-mono">Format: MP3 | Pitch optimized</p>
                        </div>
                      </div>
                      <audio 
                        src={ttsAudioUrl} 
                        controls 
                        ref={ttsPlayerRef}
                        className="h-8 max-w-[200px]" 
                        autoPlay
                      />
                    </div>
                  )}

                </div>

                {/* 3. Subtitles Translator Hub */}
                <div className="bg-neutral-900 bg-opacity-40 border border-neutral-800 rounded-2xl p-5 space-y-4">
                  <div>
                    <span className="text-[10px] bg-red-500/10 text-red-400 font-bold px-2 py-0.5 rounded-full border border-red-500/20">AI TRANSLATOR</span>
                    <h3 className="text-base font-bold text-neutral-100 mt-1 flex items-center gap-2">
                      <Languages className="h-4 w-4 text-cyan-400" />
                      បកប្រែ Subtitles & Text គ្រប់ភាសា
                    </h3>
                    <p className="text-xs text-neutral-400">បកប្រែឯកសារ Subtitle SRT ដើមទាំងស្រុងទៅជាភាសាដទៃ ដោយរក្សាទុកពេលវេលា Timestamp យ៉ាងល្អច្បាប់។</p>
                  </div>

                  <div className="space-y-3 bg-neutral-950 p-4 rounded-xl border border-neutral-850">
                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <label className="text-[10px] text-neutral-400 block mb-1">បកប្រែទៅជាភាសា</label>
                        <select
                          value={targetTranslationLang}
                          onChange={(e) => setTargetTranslationLang(e.target.value)}
                          className="bg-neutral-900 border border-neutral-800 rounded-lg p-2 text-xs text-neutral-300 w-full focus:outline-none"
                        >
                          <option value="Khmer">Khmer (ភាសាខ្មែរ)</option>
                          <option value="English">English (អង់គ្លេស)</option>
                          <option value="Thai">Thai (ថៃ)</option>
                          <option value="Vietnamese">Vietnamese (វៀតណាម)</option>
                          <option value="French">French (បារាំង)</option>
                          <option value="Chinese">Chinese (ចិន)</option>
                        </select>
                      </div>

                      <button
                        id="btn-srt-translate"
                        onClick={translateSrtActive}
                        disabled={isTranslating}
                        className="bg-cyan-600 hover:bg-cyan-500 disabled:bg-neutral-800 disabled:text-neutral-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-1.5 shrink-0 shadow-lg shadow-cyan-950/20 mt-5 transition-colors"
                      >
                        {isTranslating ? (
                          <>
                            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                            បកប្រែ...
                          </>
                        ) : (
                          <>
                            <Languages className="h-3.5 w-3.5" />
                            បកប្រែឥឡូវនេះ (Gemini)
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                </div>

              </div>

            </div>

            {/* Down block: Stitched Dub & Video Overlay Previews and Vocal Separator */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
              
              {/* Vocal Remover Tool Visual Block */}
              <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-5 flex flex-col gap-4">
                <div>
                  <span className="text-[10px] bg-red-500/10 text-red-500 font-bold px-2 py-0.5 rounded-full border border-red-500/20">VOCAL REMOVER</span>
                  <h3 className="text-base font-bold text-neutral-100 mt-1 flex items-center gap-2">
                    <Music className="h-4 w-4 text-emerald-400" />
                    បំបែកសំឡេងចម្រៀង (Vocal Remover - DSP Simulator)
                  </h3>
                  <p className="text-xs text-neutral-400">អនុវត្តទ្រឹស្តីប្រព័ន្ធលុប Center Channel Waveforms ដើម្បីជ្រើសយកតែចំរៀង ឬភ្លេងសងខាង។</p>
                </div>

                <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-850 space-y-4">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-neutral-400">បទចម្រៀងដែលកំពុងផ្ទុក៖</span>
                    <span className="text-emerald-400 font-mono font-medium">{selectedSongName}</span>
                  </div>

                  {/* Simulated waveforms */}
                  <div className="h-20 bg-neutral-900 rounded-lg flex items-end justify-between p-3 border border-neutral-800 overflow-hidden relative">
                    {/* Visualizer bars representing stereophonic elements */}
                    {[8, 12, 18, 22, 16, 10, 4, 15, 25, 30, 24, 12, 11, 22, 28, 32, 20, 15, 25, 35, 12, 9, 14, 20, 30, 18, 12, 6, 12, 22, 15].map((val, idx) => (
                      <div 
                        key={idx} 
                        className={`w-1 rounded-full bg-gradient-to-t transition-all duration-300 ${isSeparated ? 'from-emerald-600 to-cyan-500' : 'from-red-600 to-amber-500'}`} 
                        style={{ height: `${isSeparated ? val * 0.45 : val}%` }}
                      />
                    ))}
                    <div className="absolute inset-0 flex items-center justify-center bg-neutral-950/20 backdrop-blur-[0.5px]">
                      <span className="text-[10px] bg-neutral-900 border border-neutral-700 text-neutral-300 font-mono py-1 px-2.5 rounded shadow">
                        {vocalStatusMsg}
                      </span>
                    </div>
                  </div>

                  {/* Mix Controllers */}
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-neutral-400 flex items-center gap-1">👩 សម្លេងច្រៀង (Vocal Stem Vol):</span>
                      <span className="text-neutral-200 font-bold">{vocalVolume}%</span>
                    </div>
                    <input 
                      type="range" 
                      min="0" 
                      max="100" 
                      value={vocalVolume} 
                      onChange={(e) => {
                        setVocalVolume(parseInt(e.target.value));
                        if(parseInt(e.target.value) === 0) setIsSeparated(true);
                      }} 
                      className="w-full accent-red-500 bg-neutral-800 rounded-lg"
                    />

                    <div className="flex justify-between items-center mt-2">
                      <span className="text-neutral-400 flex items-center gap-1">🎹 សម្លេងភ្លេង (Instrument Vol):</span>
                      <span className="text-neutral-200 font-bold">{musicVolume}%</span>
                    </div>
                    <input 
                      type="range" 
                      min="0" 
                      max="100" 
                      value={musicVolume} 
                      onChange={(e) => setMusicVolume(parseInt(e.target.value))} 
                      className="w-full accent-cyan-500 bg-neutral-800 rounded-lg"
                    />
                  </div>

                  {/* Operational triggers */}
                  <div className="flex gap-2">
                    {isSeparated ? (
                      <button
                        onClick={handleResetVocals}
                        className="bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border border-neutral-700 font-bold text-xs py-2 px-4 rounded-xl flex-1 text-center"
                      >
                        Reset Stereo Track
                      </button>
                    ) : (
                      <button
                        onClick={handleSeparateVocalsSim}
                        disabled={isSeparating}
                        className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-neutral-800 text-white font-bold text-xs py-2 px-4 rounded-xl flex-1 text-center transition-all"
                      >
                        {isSeparating ? "កំពុងបំបែក..." : "អនុវត្តការលុបសម្លេងចម្រៀង (Phase Cancel)"}
                      </button>
                    )}
                  </div>

                </div>
              </div>

              {/* Hardcode Subtitle burner and video simulation */}
              <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-5 flex flex-col gap-4">
                <div>
                  <span className="text-[10px] bg-red-500/10 text-red-400 font-bold px-2 py-0.5 rounded-full border border-red-500/20">PREVIEW VIDEO CANVAS</span>
                  <h3 className="text-base font-bold text-neutral-100 mt-1 flex items-center gap-2">
                    <Video className="h-4 w-4 text-orange-400" />
                    ការ បញ្ជូល Subtitles (SRT) ក្នុងវីដេអូ
                  </h3>
                  <p className="text-xs text-neutral-400">គំរូទម្រង់ Frame Blending Simulation ដើម្បីបញ្ជាក់ពីរបៀបដែល Subtitles នឹងបង្ហាញលើវីដេអូ។</p>
                </div>

                <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-850 space-y-4">
                  
                  {/* Outer Video simulation container */}
                  <div 
                    className="aspect-video w-full rounded-xl border border-neutral-800 relative overflow-hidden flex flex-col justify-end p-4 shadow-inner"
                    style={{ background: videoBackPlaneColor }}
                  >
                    
                    {/* Visual decor layout for film */}
                    <div className="absolute top-2 left-2 flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-red-500 animate-ping"></span>
                      <span className="text-[9px] bg-neutral-900/80 text-neutral-300 font-mono px-2 py-0.5 rounded border border-neutral-800">
                        REC SIMULATOR: {Math.floor(videoPlayTimeMs / 1000)}s
                      </span>
                    </div>

                    <div className="absolute top-2 right-2 flex items-center gap-1.5">
                      <span className="text-[9px] bg-neutral-950/80 text-rose-400 font-mono px-2 py-0.5 rounded border border-rose-900/30">
                        HARD-SUB OVERLAY
                      </span>
                    </div>

                    {/* Simulating cinematic graphics frames inside */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
                      <Film className="h-28 w-28 text-white animate-spin" style={{ animationDuration: '40s' }} />
                    </div>

                    {/* Subtitle hardoverlay text */}
                    {activeSubtitleInVideoSim ? (
                      <div className="w-full text-center pb-4 z-10 transition-all">
                        <span 
                          className="px-3 py-1 rounded transition-all inline-block text-center select-none uppercase-control border border-black/10 shadow-lg"
                          style={{
                            fontSize: `${subFontSize}px`,
                            color: subFontColor,
                            fontWeight: subFontWeight === "bold" ? "bold" : "600",
                            backgroundColor: `rgba(0, 0, 0, ${subBgOpacity / 100})`,
                          }}
                        >
                          {activeSubtitleInVideoSim.text}
                        </span>
                      </div>
                    ) : (
                      <div className="w-full text-center pb-4 z-10 text-xs text-neutral-600 italic">
                        [ គ្មាន Subtitle បង្ហាញនៅវិនាទីនេះ ]
                      </div>
                    )}
                  </div>

                  {/* Burn Customize Controllers */}
                  <div className="grid grid-cols-2 gap-3 text-xs border-t border-neutral-900 pt-3">
                    <div>
                      <span className="text-neutral-400 block mb-1">ទំហំអក្សរ (Font Size):</span>
                      <input 
                        type="number" 
                        value={subFontSize} 
                        onChange={(e) => setSubFontSize(Math.max(12, Math.min(30, parseInt(e.target.value) || 16)))} 
                        className="bg-neutral-900 border border-neutral-850 rounded px-2.5 py-1 text-center font-bold text-neutral-200 w-full focus:outline-none"
                      />
                    </div>

                    <div>
                      <span className="text-neutral-400 block mb-1">ពណ៌អក្សរ (Font Color):</span>
                      <select 
                        value={subFontColor} 
                        onChange={(e) => setSubFontColor(e.target.value)}
                        className="bg-neutral-900 border border-neutral-850 rounded px-2.5 py-1 text-neutral-200 w-full focus:outline-none"
                      >
                        <option value="#ffffff">White (ពណ៌ស)</option>
                        <option value="#fbbf24">Amber Yellow (លឿង)</option>
                        <option value="#34d399">Green (បៃតង)</option>
                        <option value="#f43f5e">Crimson (ក្រហម)</option>
                      </select>
                    </div>

                    <div>
                      <span className="text-neutral-400 block mb-1">កម្រិតស្រទាប់ពណ៌ខ្មៅ (BG Opacity):</span>
                      <select 
                        value={subBgOpacity} 
                        onChange={(e) => setSubBgOpacity(parseInt(e.target.value))}
                        className="bg-neutral-900 border border-neutral-850 rounded px-2.5 py-1 text-neutral-200 w-full focus:outline-none"
                      >
                        <option value="0">រលុបទាំងស្រុង (0%)</option>
                        <option value="40">ថ្លាបង្គួរ (40%)</option>
                        <option value="60">ល្មមមើលច្បាស់ (60%)</option>
                        <option value="90">ខ្មៅច្បាស់ (90%)</option>
                      </select>
                    </div>

                    <div className="flex flex-col justify-end">
                      <button
                        onClick={() => setPlayingVideoSim(!playingVideoSim)}
                        className={`w-full font-bold text-xs py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                          playingVideoSim 
                            ? "bg-amber-600 hover:bg-amber-500 text-white" 
                            : "bg-red-600 hover:bg-red-500 text-white"
                        }`}
                      >
                        {playingVideoSim ? (
                          <>
                            <Pause className="h-3.5 w-3.5" />
                            ផ្អាកការលេង (Sim)
                          </>
                        ) : (
                          <>
                            <Play className="h-3.5 w-3.5" />
                            ចាកវីដេអូសាកល្បង
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                </div>
              </div>

            </div>

          </div>
        )}

        {/* ==================== TAB 2 STATEMENT (PYTHON PYQT6 CODE GENERATOR) ==================== */}
        {activeTab === "python-code" && (
          <div className="space-y-6 animate-fade-in" id="workspace-pycode">
            
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-neutral-900 p-5 rounded-2xl border border-neutral-800">
              <div>
                <h2 className="text-lg font-bold text-neutral-100 flex items-center gap-2">
                  <Cpu className="h-5.5 w-5.5 text-red-500" />
                  អ្នកបង្កើតកូដកម្មវិធី Python PyQt6 ពេញលេញ 
                </h2>
                <p className="text-xs text-neutral-400 mt-1">
                  ជ្រើសរើសផ្នែកណាមួយខាងក្រោម ដើម្បីទាញយក ឬចម្លងប្រភពកូដដែលបានរៀបចំស្អាតសម្រាប់ដំណើរការ Offline ល្បឿនលឿនលើម៉ាស៊ីនផ្ទាល់ខ្លួន!
                </p>
              </div>
              <div className="bg-neutral-950 px-3 py-1.5 rounded-lg border border-neutral-800 text-[11px] text-amber-500 font-medium">
                PyQt6 | Edge-TTS | Whisper Speech
              </div>
            </div>

            {/* Sub-selectors for Code segments */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              
              <div className="md:col-span-1 flex flex-col gap-2 bg-neutral-900/40 p-3 rounded-2xl border border-neutral-800">
                <span className="text-[10px] text-neutral-500 font-bold uppercase px-3.5 py-1 tracking-wider">បញ្ជីម៉ូឌុលកូដចម្បង</span>
                {pyqtCodeTemplates.map(tmpl => (
                  <button
                    key={tmpl.id}
                    onClick={() => setSelectedCodeTemplateId(tmpl.id)}
                    className={`w-full text-left px-3.5 py-3 rounded-xl text-xs font-semibold border transition-all ${
                      selectedCodeTemplateId === tmpl.id 
                        ? "bg-red-500/10 border-red-500/50 text-red-400 font-bold shadow-sm" 
                        : "bg-neutral-950/40 border-transparent hover:bg-neutral-900 text-neutral-400 hover:text-white"
                    }`}
                  >
                    <p className="leading-snug">{tmpl.titleKhmer}</p>
                    <p className="text-[9px] text-neutral-500 font-normal mt-1">{tmpl.titleEnglish}</p>
                  </button>
                ))}
              </div>

              {/* Viewer block with absolute formatting */}
              <div className="md:col-span-3 flex flex-col gap-4 bg-neutral-900/50 border border-neutral-850 rounded-2xl p-5">
                {(() => {
                  const tmpl = pyqtCodeTemplates.find(t => t.id === selectedCodeTemplateId) || pyqtCodeTemplates[0];
                  return (
                    <>
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-neutral-800 pb-4">
                        <div>
                          <h3 className="text-base font-bold text-neutral-100">{tmpl.titleKhmer}</h3>
                          <p className="text-xs text-neutral-400 mt-1 leading-relaxed">{tmpl.descriptionKhmer}</p>
                        </div>

                        <div className="flex gap-2 shrink-0">
                          <button
                            onClick={() => handleCopyCodeSnippet(tmpl.id, tmpl.code)}
                            className="bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
                          >
                            {copiedCodeId === tmpl.id ? (
                              <>
                                <Check className="h-3.5 w-3.5 text-emerald-400" />
                                បានចម្លង!
                              </>
                            ) : (
                              <>
                                <Copy className="h-3.5 w-3.5" />
                                ចម្លងកូដប្រភព
                              </>
                            )}
                          </button>
                          
                          <button
                            onClick={() => {
                              const blob = new Blob([tmpl.code], { type: "text/plain;charset=utf-8;" });
                              const url = URL.createObjectURL(blob);
                              const link = document.createElement("a");
                              link.href = url;
                              link.setAttribute("download", `${tmpl.id}_solution.py`);
                              document.body.appendChild(link);
                              link.click();
                              document.body.removeChild(link);
                              setAlertMsg({ text: `បានទាញយកឯកសារ ${tmpl.id}_solution.py រួចរាល់!`, type: "success" });
                            }}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-lg shadow-emerald-900/10"
                          >
                            <Download className="h-3.5 w-3.5" />
                            ទាញយក .py
                          </button>
                        </div>
                      </div>

                      {/* Displaying raw code inside fully scrollable monospace editor wrapper */}
                      <div className="relative rounded-xl overflow-hidden border border-neutral-800 bg-neutral-950 text-neutral-100 max-h-[500px] overflow-y-auto">
                        <div className="bg-neutral-900 px-4 py-2 text-[10px] text-neutral-500 font-mono flex items-center justify-between">
                          <span>PYTHON PYQT6 IMPLEMENTATION ENGINE</span>
                          <span className="text-red-500 font-bold">PRO DRAFT</span>
                        </div>
                        <pre className="p-4 overflow-x-auto text-[11px] leading-relaxed font-mono whitespace-pre text-neutral-300">
                          {tmpl.code}
                        </pre>
                      </div>

                      {/* Setup Instructions label info */}
                      <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 text-xs text-neutral-400 leading-relaxed font-sans space-y-2">
                        <p className="font-bold text-neutral-200">របៀបដំឡើង និងតេស្តលើកុំព្យូទ័ររបស់អ្នក៖</p>
                        <ol className="list-decimal pl-4 space-y-1">
                          <li>ដំឡើងភាសា <span className="text-yellow-500">Python 3.10+</span> ប្រសិនបើមិនទាន់មានលើកុំព្យូទ័រ។</li>
                          <li>បើក Terminal ឬ Command Prompt រួចវាយបញ្ជាដំឡើងបណ្ណាល័យជំនួយ៖
                            <code className="block bg-neutral-900 p-2.5 rounded-lg border border-neutral-800 text-emerald-400 font-mono my-1 text-[10px]">
                              pip install PyQt6 edge-tts openai-whisper pydub soundfile
                            </code>
                          </li>
                          <li>បង្កើតឯកសារឈ្មោះ <span className="text-teal-400">app.py</span> រួចបិទភ្ជាប់ (Paste) កូដដែលបានចម្លងពីទីនេះ រួចវាយបញ្ជា <code className="text-yellow-500 font-mono">python app.py</code> ដើម្បីដំណើរការ!</li>
                        </ol>
                      </div>
                    </>
                  );
                })()}
              </div>

            </div>

          </div>
        )}

      </main>

      {/* Aesthetic Footer Branding */}
      <footer className="border-t border-neutral-800 bg-neutral-950 py-10 px-6 mt-12" id="footer-decor">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Film className="h-4 w-4 text-red-500" />
            <p className="text-xs text-neutral-500">
              © 2026 AI Movie Studio & PyQt6 Generator (Cambodia). Optimized with server-side Gemini 3.5.
            </p>
          </div>
          <div className="flex gap-4 text-xs text-neutral-500 font-medium">
            <span className="hover:text-white transition-colors cursor-pointer">Documentation</span>
            <span>•</span>
            <span className="hover:text-white transition-colors cursor-pointer">Community Support</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
