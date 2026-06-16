import { create } from "zustand";
import axios from "axios";

const API_URL = "http://localhost:5005/api/executions";

export const useExecutionStore = create((set, get) => ({
  executions: [],
  selectedExecution: null,
  loading: false,
  error: null,
  search: "",
  statusFilter: "all",

  setSearch: (search) => set({ search }),
  setStatusFilter: (statusFilter) => set({ statusFilter }),

  fetchExecutions: async () => {
    set({ loading: true, error: null });

    try {
      const { search, statusFilter } = get();
      const res = await axios.get(API_URL, {
        params: {
          search: search || undefined,
          status: statusFilter !== "all" ? statusFilter : undefined
        }
      });

      set({
        executions: res.data.data || [],
        loading: false
      });
    } catch (error) {
      set({
        error: error.message,
        loading: false
      });
    }
  },

  fetchExecutionById: async (executionId) => {
    if (!executionId) return;

    set({ loading: true, error: null });

    try {
      const res = await axios.get(`${API_URL}/${executionId}`);

      set({
        selectedExecution: res.data.data,
        loading: false
      });
    } catch (error) {
      set({
        error: error.message,
        loading: false
      });
    }
  },

  clearSelectedExecution: () => set({ selectedExecution: null })
}));
