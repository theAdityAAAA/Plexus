import { create } from "zustand";
import axios from "axios";

export const useNodeStore = create((set, get) => ({
  customNodes: [],
  isWizardOpen: false,

  setWizardOpen: (isOpen) => set({ isWizardOpen: isOpen }),

  fetchCustomNodes: async () => {
    try {
      const res = await axios.get("http://localhost:5005/api/custom-nodes");
      set({ customNodes: res.data.data });
    } catch (error) {
      console.error("Failed to fetch custom nodes", error);
    }
  },

  createCustomNode: async (nodeData) => {
    try {
      const res = await axios.post("http://localhost:5000/api/custom-nodes", nodeData);
      set({ customNodes: [...get().customNodes, res.data.data] });
      return true;
    } catch (error) {
      console.error("Failed to create custom node", error);
      alert("Failed to create custom node. Make sure type is unique.");
      return false;
    }
  },

  deleteCustomNode: async (id) => {
    try {
      await axios.delete(`http://localhost:5005/api/custom-nodes/${id}`);
      set({ customNodes: get().customNodes.filter(n => n._id !== id) });
    } catch (error) {
      console.error("Failed to delete custom node", error);
    }
  }
}));
