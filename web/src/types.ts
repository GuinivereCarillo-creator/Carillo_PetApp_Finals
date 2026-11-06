export type ApiResponse<T> = {
  message: T;
  status: string;
};

export type BreedList = Record<string, string[]>;

export type BreedResponse = ApiResponse<BreedList>;

export type PhotoResponse = ApiResponse<string>;

export type PendingRequest = {
  status: string;
  endpoint: string;
};

export type Answer = {
  endpoint: string;
  data: unknown;
};
