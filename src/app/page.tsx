import { DocumentApp } from "@/features/document/components/DocumentApp";
import mock from "@/features/document/model/mock-data.json";
import { normalizeBlocks } from "@/features/document/model/normalize";
import type { RawBlockInput } from "@/features/document/model/types";

export default function Home() {
  const initialBlocks = normalizeBlocks(mock as RawBlockInput[]);

  return <DocumentApp initialBlocks={initialBlocks} />;
}
