import { useDispatch, useSelector } from "react-redux";
import { translate, type TKey } from "../utils/i18n";
import type { AppDispatch, RootState } from "./index";

export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();

/** Translation function bound to the current UI language. */
export function useT() {
  const lang = useAppSelector((s) => s.profile.language);
  return (key: TKey, vars?: Record<string, string | number>) => translate(lang, key, vars);
}
