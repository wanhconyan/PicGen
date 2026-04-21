export type PageResp<T> = {
  items: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
};

export type Character = {
  id: string;
  name: string;
  description?: string;
  status?: string;
  gender?: string;
  hairStyle?: string;
  hairColor?: string;
  identityLocks?: string[];
  styleTemplateId?: string;
  mainBaseImageVersionId?: string;
  tags?: string[];
};

export type OutfitComponent = {
  type?: string;
  name?: string;
  prompt?: string;
  [key: string]: unknown;
};

export type Outfit = {
  id: string;
  name: string;
  prompt?: string;
  tags?: string[];
  negativePrompt?: string;
  version?: number;
  components?: OutfitComponent[];
  status?: string;
};

export type Task = {
  id: string;
  type: string;
  status: string;
  characterId?: string;
  baseImageVersionId?: string;
  outfitIds?: string[];
  styleId?: string;
  sourceResultId?: string;
  maskTemplateId?: string;
  params?: Record<string, unknown>;
  error?: string;
  resultIds?: string[];
  createdAt: string;
};

export type Result = {
  id: string;
  taskId: string;
  characterId?: string;
  outfitId?: string;
  sourceResultId?: string;
  version?: number;
  imageUrl: string;
  thumbUrl?: string;
  reviewStatus?: string;
  score?: number | null;
  isPreferred?: boolean;
  metadata?: Record<string, unknown>;
  createdAt: string;
};

export type ReviewScores = {
  identityStability: number;
  handIntegrity: number;
  outfitReadability: number;
  weaponCompleteness: number;
  commercialReadiness: number;
};

export type Review = {
  id: string;
  resultId: string;
  decision: string;
  comment?: string;
  scores?: Partial<ReviewScores>;
  sendBackToEdit?: boolean;
  createdAt: string;
};

export type ExportItem = {
  id: string;
  resultId: string;
  fileName: string;
  path: string;
  metadataPath?: string;
  thumbnailPath?: string;
  status: string;
  errorMessage?: string;
  createdAt: string;
};
