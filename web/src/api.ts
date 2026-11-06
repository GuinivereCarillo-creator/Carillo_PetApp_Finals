import type { BreedResponse, PhotoResponse } from "./types";

const API_ROOT = "https://dog.ceo/api";

const request = async <T>(path: string): Promise<T> => {
  const response = await fetch(`${API_ROOT}${path}`, {
    headers: { Accept: "application/json" }
  });

  if (!response.ok) {
    throw new Error(`The Dog API returned status ${response.status}.`);
  }

  return (await response.json()) as T;
};

export const loadBreeds = (): Promise<BreedResponse> =>
  request<BreedResponse>("/breeds/list/all");

export const loadPhoto = (breed: string): Promise<PhotoResponse> =>
  request<PhotoResponse>(
    `/breed/${breed
      .split("/")
      .map((part) => encodeURIComponent(part))
      .join("/")}/images/random`
  );
