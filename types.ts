
export interface LabValue {
  test_name: string;
  value: string;
  unit: string;
  standard_range?: string;
}

export interface ExtractedLabData {
  lab_values: LabValue[];
}

export interface GroundingChunk {
  web?: {
    uri: string;
    title: string;
  };
}
export interface ResearchData {
    summary: string;
    sources: GroundingChunk[];
}
