export interface Subtitle {
  id: string;
  index: number;
  startTime: string; // "00:00:01,000"
  endTime: string;   // "00:00:04,500"
  text: string;
  speaker: "male" | "female";
}

export type ActiveTab = "studio" | "python-code" | "vocal-remover-tab";

export interface PyCodeTemplate {
  id: string;
  titleKhmer: string;
  titleEnglish: string;
  descriptionKhmer: string;
  descriptionEnglish: string;
  code: string;
}
