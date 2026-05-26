import { Subtitle } from "./types";

export const initialSubtitles: Subtitle[] = [
  {
    id: "sub-1",
    index: 1,
    startTime: "00:00:01,200",
    endTime: "00:00:04,500",
    text: "សួស្តីបងប្អូនទាំងអស់គ្នា! សូមស្វាគមន៍មកកាន់ AI Movie Studio។",
    speaker: "female"
  },
  {
    id: "sub-2",
    index: 2,
    startTime: "00:00:05,000",
    endTime: "00:00:08,800",
    text: "ថ្ងៃនេះយើងនឹងសិក្សាអំពី របៀបផ្លាស់ប្តូរសំឡេង និង បញ្ចូលអក្សរក្នុងវីដេអូ។",
    speaker: "male"
  },
  {
    id: "sub-3",
    index: 3,
    startTime: "00:00:09,200",
    endTime: "00:00:13,000",
    text: "វាជាបច្ចេកវិទ្យាដ៏អស្ចារ្យ ដែលជួយសម្រួលការងារផលិតកុនបានលឿនបំផុត។",
    speaker: "female"
  }
];

export const sampleAudios = [
  {
    id: "khmer-greeting",
    label: "សំឡេងនិយាយសាកល្បងទី១ (Khmer Voiceover Sample)",
    text: "សួស្តីបងប្អូនទាំងអស់គ្នា! សូមស្វាគមន៍មកកាន់ AI Movie Studio របស់ប្រទេសកម្ពុជា។",
    speaker: "female",
    lang: "km-KH"
  },
  {
    id: "epic-introduction",
    label: "សំឡេងនិយាយសាកល្បងទី២ (Epic Movie Dialogue)",
    text: "In a world ruled by artificial intelligence, one simple coder decided to build PyQt6 movie tools.",
    speaker: "male",
    lang: "en-US"
  }
];
