import { Dispatch, SetStateAction } from "react";

export type TabType =
  | "home"
  | "usajili"
  | "mafunzo"
  | "reports"
  | "messages"
  | "profile"
  | "picha"; // ✅ ongeza hii line

export type SetActiveTab = Dispatch<SetStateAction<TabType>>;
