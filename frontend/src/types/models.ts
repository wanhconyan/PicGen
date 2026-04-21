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
};

export type Outfit = {
  id: string;
  name: string;
  prompt?: string;
};

export type Task = {
  id: string;
  type: string;
  status: string;
  characterId?: string;
  createdAt: string;
};

export type Result = {
  id: string;
  taskId: string;
  characterId?: string;
  outfitId?: string;
  imageUrl: string;
  reviewStatus?: string;
  score?: number | null;
  metadata?: Record<string, unknown>;
  createdAt: string;
};

export type Review = {
  id: string;
  resultId: string;
  decision: string;
  comment?: string;
  createdAt: string;
};

export type ExportItem = {
  id: string;
  resultId: string;
  fileName: string;
  path: string;
  status: string;
  createdAt: string;
};
